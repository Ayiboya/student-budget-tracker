document.addEventListener('DOMContentLoaded', () => {
    loadGoals();
    setupModals();
});

async function loadGoals() {
    try {
        const response = await fetchAPI('/goals');
        const goals = response.data;
        const container = document.getElementById('goals-container');
        container.innerHTML = '';
        
        if(goals.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No savings goals yet. Create one!</p>';
            return;
        }

        goals.forEach(g => {
            const percentage = Math.min(100, (g.currentAmount / g.targetAmount) * 100);
            const isComplete = percentage >= 100;
            
            container.innerHTML += `
                <div class="glass-card">
                    <h3 style="margin-bottom: 0.5rem; display:flex; justify-content:space-between;">
                        ${g.title}
                        ${isComplete ? '<span style="color:var(--success); font-size:0.8rem;"><i class="fas fa-check-circle"></i> Done</span>' : ''}
                    </h3>
                    <div class="goal-stats">
                        <span>GHS ${g.currentAmount.toFixed(2)}</span>
                        <span>Target: GHS ${g.targetAmount.toFixed(2)}</span>
                    </div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-size: 0.8rem; color: var(--text-muted);">
                            ${g.deadline ? 'Due: ' + g.deadline : 'No deadline'}
                        </span>
                        ${!isComplete ? `<button onclick="openProgressModal(${g.id})" class="btn" style="padding: 0.25rem 0.75rem; background: rgba(59, 130, 246, 0.2); color: var(--accent);"><i class="fas fa-plus"></i> Add</button>` : ''}
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error(error);
    }
}

function setupModals() {
    const addForm = document.getElementById('addGoalForm');
    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            title: document.getElementById('goalTitle').value,
            targetAmount: parseFloat(document.getElementById('goalTarget').value),
            deadline: document.getElementById('goalDeadline').value
        };
        try {
            await fetchAPI('/goals', 'POST', payload);
            closeGoalModal();
            addForm.reset();
            loadGoals();
        } catch (error) { console.error(error); }
    });

    const progressForm = document.getElementById('updateProgressForm');
    progressForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('progressGoalId').value;
        const payload = {
            amountToAdd: parseFloat(document.getElementById('progressAmount').value)
        };
        try {
            await fetchAPI(`/goals/${id}/progress`, 'PUT', payload);
            closeProgressModal();
            progressForm.reset();
            loadGoals();
        } catch (error) { console.error(error); }
    });
}

function openGoalModal() { document.getElementById('goalModal').classList.add('active'); }
function closeGoalModal() { document.getElementById('goalModal').classList.remove('active'); }

function openProgressModal(id) { 
    document.getElementById('progressGoalId').value = id;
    document.getElementById('progressModal').classList.add('active'); 
}
function closeProgressModal() { document.getElementById('progressModal').classList.remove('active'); }
