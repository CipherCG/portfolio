// GitHub Repository Config
const REPO_OWNER = 'CipherCG';
const REPO_NAME = 'portfolio';
const FILE_PATH = 'projects.json';

let globalProjects = [];
let fileSHA = ''; // SHA hash required by GitHub API for updating files

document.addEventListener('DOMContentLoaded', () => {
    // 1. Dynamic Footer Year
    const yearSpan = document.getElementById('year');
    if (yearSpan) yearSpan.textContent = new Date().getFullYear();

    // 2. Initialize Dark/Light Theme Switcher
    initThemeToggle();

    // 3. Load Projects & Verify Admin Session
    fetchProjectsFromGitHub();
    checkAdminAuth();

    // 4. Admin Event Listeners
    const adminLink = document.getElementById('admin-login-link');
    if (adminLink) {
        adminLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('login-modal');
        });
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const token = document.getElementById('token-input').value.trim();
            if (token) {
                sessionStorage.setItem('gh_pat', token);
                closeModal('login-modal');
                checkAdminAuth();
                renderProjects(globalProjects);
            }
        });
    }

    const projectForm = document.getElementById('project-form');
    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectSubmit);
    }
});

/* ==========================================================================
   Theme Management
   ========================================================================== */
function initThemeToggle() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (!themeToggleBtn) return;

    const themeIcon = themeToggleBtn.querySelector('.theme-icon');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', savedTheme);
    if (themeIcon) themeIcon.textContent = savedTheme === 'dark' ? '🌙' : '☀️';

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        if (themeIcon) themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    });
}

/* ==========================================================================
   Fetch & Render Projects via GitHub API
   ========================================================================== */
async function fetchProjectsFromGitHub() {
    const grid = document.getElementById('projects-grid');
    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`);
        if (!response.ok) throw new Error('Failed to fetch projects file.');
        
        const fileData = await response.json();
        fileSHA = fileData.sha; // Save current file SHA for committing updates
        
        // Decode UTF-8 Base64 content from GitHub REST API
        const jsonString = decodeURIComponent(escape(atob(fileData.content.replace(/\s/g, ''))));
        globalProjects = JSON.parse(jsonString);

        renderProjects(globalProjects);
        setupFilterListeners();
    } catch (error) {
        console.error(error);
        if (grid) grid.innerHTML = '<p>Error loading projects from GitHub repository.</p>';
    }
}

function renderProjects(projects) {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    const isAdmin = !!sessionStorage.getItem('gh_pat');

    if (projects.length === 0) {
        grid.innerHTML = '<p>No projects found.</p>';
        return;
    }

    grid.innerHTML = projects.map(project => `
        <article class="card project-card" data-category="${project.category}">
            <div class="project-header">
                <span class="project-folder">📁</span>
                <div class="project-links">
                    ${project.repo_url ? `<a href="${project.repo_url}" target="_blank" rel="noopener">GitHub</a>` : ''}
                    ${project.live_url ? `<a href="${project.live_url}" target="_blank" rel="noopener">Live Demo</a>` : ''}
                </div>
            </div>
            <h3 class="project-title">${project.title}</h3>
            <p class="project-description">${project.description}</p>
            <div class="tags">
                ${project.tech_stack.map(tech => `<span class="tag">${tech}</span>`).join('')}
            </div>
            ${isAdmin ? `
                <div class="card-admin-actions">
                    <button class="btn btn-secondary btn-sm" onclick="editProject('${project.id}')">✏️ Edit</button>
                    <button class="btn btn-secondary btn-sm" style="color: #ff6b6b; border-color: #ff6b6b;" onclick="deleteProject('${project.id}')">🗑️ Delete</button>
                </div>
            ` : ''}
        </article>
    `).join('');
}

function setupFilterListeners() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filterValue = button.getAttribute('data-filter');
            const filtered = filterValue === 'all' 
                ? globalProjects 
                : globalProjects.filter(p => p.category === filterValue);
            
            renderProjects(filtered);
        });
    });
}

/* ==========================================================================
   Admin Authentication & Modal Handlers
   ========================================================================== */
function checkAdminAuth() {
    const token = sessionStorage.getItem('gh_pat');
    const adminBar = document.getElementById('admin-bar');
    if (adminBar) {
        adminBar.style.display = token ? 'flex' : 'none';
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('gh_pat');
    checkAdminAuth();
    renderProjects(globalProjects);
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

function openProjectModal(project = null) {
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('project-form');
    
    if (project) {
        if (modalTitle) modalTitle.textContent = 'Edit Project';
        document.getElementById('p-id').value = project.id;
        document.getElementById('p-title').value = project.title;
        document.getElementById('p-desc').value = project.description;
        document.getElementById('p-stack').value = project.tech_stack.join(', ');
        document.getElementById('p-category').value = project.category;
        document.getElementById('p-repo').value = project.repo_url || '';
        document.getElementById('p-live').value = project.live_url || '';
    } else {
        if (modalTitle) modalTitle.textContent = 'Add New Project';
        if (form) form.reset();
        document.getElementById('p-id').value = '';
    }
    openModal('project-modal');
}

function editProject(id) {
    const project = globalProjects.find(p => p.id === id);
    if (project) openProjectModal(project);
}

async function deleteProject(id) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    globalProjects = globalProjects.filter(p => p.id !== id);
    await commitProjectsToGitHub('Delete project via portfolio admin');
}

/* ==========================================================================
   GitHub API Commit Logic
   ========================================================================== */
async function handleProjectSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('save-project-btn');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Committing to GitHub...';
    }

    const id = document.getElementById('p-id').value || `proj-${Date.now()}`;
    const newProject = {
        id,
        title: document.getElementById('p-title').value,
        description: document.getElementById('p-desc').value,
        tech_stack: document.getElementById('p-stack').value.split(',').map(s => s.trim()),
        category: document.getElementById('p-category').value,
        repo_url: document.getElementById('p-repo').value,
        live_url: document.getElementById('p-live').value
    };

    const existingIndex = globalProjects.findIndex(p => p.id === id);
    if (existingIndex > -1) {
        globalProjects[existingIndex] = newProject;
    } else {
        globalProjects.unshift(newProject);
    }

    const success = await commitProjectsToGitHub(`Update project: ${newProject.title}`);
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'Commit Changes to GitHub';
    }
    if (success) closeModal('project-modal');
}

async function commitProjectsToGitHub(commitMessage) {
    const token = sessionStorage.getItem('gh_pat');
    if (!token) {
        alert('Admin token missing. Please log in again.');
        return false;
    }

    // Convert updated JSON data to Base64 format for GitHub API
    const updatedContentBase64 = btoa(unescape(encodeURIComponent(JSON.stringify(globalProjects, null, 2))));

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: commitMessage,
                content: updatedContentBase64,
                sha: fileSHA
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Failed to commit to GitHub');
        }

        const responseData = await response.json();
        fileSHA = responseData.content.sha; // Save new SHA hash for subsequent edits
        alert('Success! Changes committed directly to GitHub. Pages will re-deploy automatically.');
        renderProjects(globalProjects);
        return true;
    } catch (err) {
        alert(`Commit Failed: ${err.message}`);
        return false;
    }
}
