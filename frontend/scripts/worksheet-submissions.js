// frontend/src/scripts/worksheet-submissions.js

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const teacherAssignmentId = urlParams.get('id');
    const className = urlParams.get('name') || 'Class';

    document.getElementById('submission-header').textContent = `Review Submissions: ${decodeURIComponent(className)}`;

    if (!teacherAssignmentId) {
        document.getElementById('chapter-list-container').innerHTML = '<p>Error: No class ID specified.</p>';
        return;
    }

    loadCompletedChapters(teacherAssignmentId);
    setupEventListeners(teacherAssignmentId);
});

/**
 * Loads the list of completed chapters for this class.
 */
async function loadCompletedChapters(teacherAssignmentId) {
    const container = document.getElementById('chapter-list-container');
    const token = localStorage.getItem('token');
    container.innerHTML = '<p>Loading completed chapters...</p>';

    try {
        const response = await fetch(`/api/syllabus/tracker/${teacherAssignmentId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Could not fetch chapters.');

        const data = await response.json();
        const completedChapters = data.chapters.filter(chap => chap.is_completed);

        if (completedChapters.length === 0) {
            container.innerHTML = '<p>No worksheets have been generated for this class yet.</p>';
            return;
        }

        container.innerHTML = ''; // Clear loading
        completedChapters.forEach(chap => {
            container.innerHTML += `
                <button class="btn chapter-select-btn" 
                        data-chapter-id="${chap.chapter_id}" 
                        data-chapter-name="${chap.chapter_name}">
                    ${chap.chapter_order}. ${chap.chapter_name}
                </button>
            `;
        });

    } catch (error) {
        container.innerHTML = `<p>${error.message}</p>`;
    }
}

/**
 * Sets up all click listeners for the page.
 */
function setupEventListeners(teacherAssignmentId) {
    const chapterContainer = document.getElementById('chapter-list-container');
    const submissionList = document.getElementById('student-submission-list');

    // --- 1. Handle Chapter Selection ---
    chapterContainer.addEventListener('click', e => {
        if (e.target.classList.contains('chapter-select-btn')) {
            const chapterId = e.target.dataset.chapterId;
            const chapterName = e.target.dataset.chapterName;

            document.querySelectorAll('.chapter-select-btn').forEach(btn => btn.classList.remove('btn-active'));
            e.target.classList.add('btn-active');

            loadSubmissionsForChapter(teacherAssignmentId, chapterId, chapterName);
        }
    });

    // --- 2. Handle Toggle Button Clicks (Answers/Remarks) ---
    // This listener is attached to the parent list
    submissionList.addEventListener('click', e => {
        const button = e.target;
        let targetId = null;
        let isActive = button.classList.contains('btn-active');

        if (button.classList.contains('btn-view-answers')) {
            targetId = button.dataset.targetAnswer;
        } else if (button.classList.contains('btn-view-remarks')) {
            targetId = button.dataset.targetRemark;
        }

        if (targetId) {
            const targetDiv = document.getElementById(targetId);
            if (targetDiv) {
                // Toggle visibility
                targetDiv.classList.toggle('hidden', isActive);
                // Toggle button active state
                button.classList.toggle('btn-active', !isActive);
                
                // Update button text
                if (!isActive) {
                    button.textContent = 'Hide ' + (button.classList.contains('btn-view-answers') ? 'Answers' : 'Remarks');
                } else {
                    button.textContent = 'View ' + (button.classList.contains('btn-view-answers') ? 'Answers' : 'Remarks');
                }
            }
        }
    });
}

/**
 * Fetches all submissions for a chapter and renders the student list.
 * This is the main function that loads all data.
 */
async function loadSubmissionsForChapter(teacherAssignmentId, chapterId, chapterName) {
    const section = document.getElementById('worksheet-section');
    const list = document.getElementById('student-submission-list');
    const title = document.getElementById('worksheet-chapter-title');
    const submittedCountEl = document.getElementById('submitted-count');
    const totalCountEl = document.getElementById('total-count');
    const token = localStorage.getItem('token');

    section.classList.remove('hidden');
    title.textContent = `Submissions for: ${chapterName}`;
    list.innerHTML = '<p>Loading submissions...</p>';

    try {
        const response = await fetch(`/api/submissions/chapter/${teacherAssignmentId}/${chapterId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
             const errData = await response.json();
             throw new Error(errData.message || 'Could not fetch submissions.');
        }

        const submissions = await response.json();
        
        if (submissions.length === 0) {
            list.innerHTML = '<p>No students are enrolled in this section.</p>';
            submittedCountEl.textContent = 0;
            totalCountEl.textContent = 0;
            return;
        }

        list.innerHTML = ''; // Clear loading
        let submittedCount = 0;

        submissions.forEach((sub, index) => {
            const hasSubmitted = !!sub.submission_id;
            if (hasSubmitted) submittedCount++;

            const uniqueId = `sub-${index}`;
            const answerId = `answer-${uniqueId}`;
            const remarkId = `remark-${uniqueId}`;

            // ✅ --- NEW ROBUST DATA CHECKING --- ✅
            // Check and format the answers
            const answersContent = (function(sub) {
                if (!sub.submission_id) return 'Student has not submitted.';
                if (sub.student_answers_raw && sub.student_answers_raw.trim() !== '') {
                    return sub.student_answers_raw;
                }
                // If submission exists but answers are null/empty
                return 'Error: Student answers were not found in the database. (Raw data is null or empty).';
            })(sub);

            // Check and format the remarks
            const remarksContent = (function(sub) {
                if (!sub.submission_id) return 'No submission to evaluate.';
                
                // Case 1: AI Evaluation is complete
                if (sub.ai_evaluation_details && sub.ai_evaluation_details.trim() !== '') {
                    return sub.ai_evaluation_details;
                }
                
                // Case 2: AI marked as Error
                if (sub.ai_assigned_marks === 'Error') {
                     return `AI evaluation failed.\nDetails: ${sub.ai_evaluation_details || 'No error details provided.'}`;
                }
                
                // Case 3: AI is still processing (marked as "Processing" or "Needs Review" but details are not back yet)
                if (sub.ai_assigned_marks && !sub.ai_evaluation_details) {
                     return 'AI evaluation is still in progress. Please check back in a few minutes...';
                }

                // Case 4: Default fallback
                return 'AI evaluation has not run yet or data is missing.';
            })(sub);
            
            // ✅ --- END OF NEW LOGIC --- ✅

            list.innerHTML += `
                <div class="list-group-item">
                    <div class="student-submission-header">
                        <strong>${sub.roll_number || 'N/A'}. ${sub.student_name}</strong>
                        <span class="badge ${hasSubmitted ? 'success' : 'danger'}">
                            ${sub.ai_assigned_marks || (hasSubmitted ? 'Processing' : 'Not Submitted')}
                        </span>
                    </div>
                    ${hasSubmitted ? `
                    <div class="student-submission-actions">
                        <button class="btn btn-view-answers" 
                                data-target-answer="${answerId}">
                            View Answers
                        </button>
                        <button class="btn btn-view-remarks" 
                                data-target-remark="${remarkId}">
                            View Remarks
                        </button>
                    </div>
                    <div id="${answerId}" class="submission-details answers-container hidden">
                        <h5>Student Answers:</h5>
                        <pre>${answersContent}</pre>
                    </div>
                    <div id="${remarkId}" class="submission-details remarks-container hidden">
                        <h5>AI Evaluation & Remarks:</h5>
                        <pre>${remarksContent}</pre>
                    </div>
                    ` : ''}
                </div>
            `;
        });

        // Update stats
        submittedCountEl.textContent = submittedCount;
        totalCountEl.textContent = submissions.length;

    } catch (error) {
        list.innerHTML = `<p style="color: red; font-weight: bold;">Error: ${error.message}</p>`;
    }
}