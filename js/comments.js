document.addEventListener('DOMContentLoaded', () => {
    const commentsContainer = document.getElementById('comments-section');
    if (!commentsContainer) return;

    // Get a unique ID for this blog post based on its filename
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    const postId = commentsContainer.getAttribute('data-post-id') || filename;

    // Soft pastel color palette for avatars
    const avatarColors = [
        '#aebce6', // Muted periwinkle
        '#5d7c99', // Muted slate blue
        '#8fa6b8', // Muted denim
        '#b3c3cc', // Muted light blue
        '#c4aeb7', // Muted rose
        '#a1bfa8', // Muted sage
        '#d3be9f'  // Muted sand
    ];

    // Helper: Pick a color deterministically based on name
    function getAvatarColor(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        const index = Math.abs(hash) % avatarColors.length;
        return avatarColors[index];
    }

    // Helper: Escape HTML to prevent XSS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    // Load comments from Local Storage
    function getComments() {
        const stored = localStorage.getItem(`comments_${postId}`);
        return stored ? JSON.parse(stored) : [];
    }

    // Save comments to Local Storage
    function saveComment(commentObj) {
        const comments = getComments();
        comments.push(commentObj);
        localStorage.setItem(`comments_${postId}`, JSON.stringify(comments));
    }

    // Render the comments list and form HTML
    function initComments() {
        commentsContainer.innerHTML = `
            <div class="comments-section-wrapper">
                <h3 class="comments-title" id="comments-count-title">Comments (0)</h3>
                
                <div class="comments-list" id="comments-list">
                    <!-- Dynamic comments list will go here -->
                </div>
                
                <div class="comment-form-container">
                    <h4 class="comment-form-title">Leave a Comment</h4>
                    <div class="comment-success-message" id="comment-success-alert">
                        ✨ Your comment has been posted successfully!
                    </div>
                    <form class="comment-form" id="comment-form" novalidate>
                        <div class="comment-form-row">
                            <div class="form-group" id="group-name">
                                <label for="comment-name">Name *</label>
                                <input type="text" id="comment-name" name="name" placeholder="Your name" required>
                                <span class="error-message">Name is required.</span>
                            </div>
                            <div class="form-group" id="group-email">
                                <label for="comment-email">Email (Optional)</label>
                                <input type="email" id="comment-email" name="email" placeholder="your.email@example.com">
                                <span class="error-message">Please enter a valid email address.</span>
                            </div>
                        </div>
                        <div class="form-group" id="group-text">
                            <label for="comment-text">Comment *</label>
                            <textarea id="comment-text" name="comment" placeholder="Write your thoughts..." required></textarea>
                            <span class="error-message">Comment cannot be empty.</span>
                        </div>
                        <button type="submit" class="btn btn-submit">Post Comment</button>
                    </form>
                </div>
            </div>
        `;

        renderCommentsList();

        const form = document.getElementById('comment-form');
        form.addEventListener('submit', handleFormSubmit);

        // Remove invalid classes on input typing
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                input.closest('.form-group').classList.remove('invalid');
            });
        });
    }

    // Render comments list
    function renderCommentsList() {
        const comments = getComments();
        const listContainer = document.getElementById('comments-list');
        const countTitle = document.getElementById('comments-count-title');
        
        countTitle.textContent = `Comments (${comments.length})`;

        if (comments.length === 0) {
            listContainer.innerHTML = `<p style="font-style: italic; color: #888; margin: 10px 0;">No comments yet. Be the first to share your thoughts!</p>`;
            return;
        }

        listContainer.innerHTML = comments.map(c => {
            const initial = c.name.charAt(0).toUpperCase();
            const avatarColor = getAvatarColor(c.name);
            const dateStr = new Date(c.date).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            return `
                <div class="comment-card">
                    <div class="comment-avatar" style="background-color: ${avatarColor};">
                        ${initial}
                    </div>
                    <div class="comment-content">
                        <div class="comment-meta">
                            <span class="comment-author">${escapeHTML(c.name)}</span>
                            <span class="comment-date">${dateStr}</span>
                        </div>
                        <p class="comment-text">${escapeHTML(c.comment).replace(/\n/g, '<br>')}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Handle Form Submit
    function handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const nameInput = document.getElementById('comment-name');
        const emailInput = document.getElementById('comment-email');
        const textInput = document.getElementById('comment-text');

        let isValid = true;

        // Name Validation
        if (!nameInput.value.trim()) {
            document.getElementById('group-name').classList.add('invalid');
            isValid = false;
        } else {
            document.getElementById('group-name').classList.remove('invalid');
        }

        // Comment Validation
        if (!textInput.value.trim()) {
            document.getElementById('group-text').classList.add('invalid');
            isValid = false;
        } else {
            document.getElementById('group-text').classList.remove('invalid');
        }

        // Email Validation (optional but must be valid if entered)
        const emailValue = emailInput.value.trim();
        if (emailValue) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailValue)) {
                document.getElementById('group-email').classList.add('invalid');
                isValid = false;
            } else {
                document.getElementById('group-email').classList.remove('invalid');
            }
        } else {
            document.getElementById('group-email').classList.remove('invalid');
        }

        if (!isValid) return;

        // Save comment
        const newComment = {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            comment: textInput.value.trim(),
            date: new Date().toISOString()
        };

        saveComment(newComment);
        renderCommentsList();
        form.reset();

        // Show Success Alert
        const successAlert = document.getElementById('comment-success-alert');
        successAlert.style.display = 'block';
        setTimeout(() => {
            successAlert.style.display = 'none';
        }, 5000);
    }

    initComments();
});
