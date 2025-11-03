document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('diary-form');
    const entriesDiv = document.getElementById('entries');
    const dateInput = document.getElementById('date');
    const didInput = document.getElementById('did');
    const problemsInput = document.getElementById('problems');
    const solutionsInput = document.getElementById('solutions');
    const exportAllButton = document.getElementById('export-all');
    const shareAllButton = document.getElementById('share-all');
    const searchDateInput = document.getElementById('search-date');
    const entryList = document.getElementById('entry-list');
    const quickFillSelect = document.getElementById('quick-fill-select');
    const applyTemplateButton = document.getElementById('apply-template');
    const saveTemplateButton = document.getElementById('save-template');
    const deleteTemplateButton = document.getElementById('delete-template');
    const submitButton = document.getElementById('submit-entry');

    let entries = JSON.parse(localStorage.getItem('swimmingDiary')) || [];
    let editIndex = -1;
    const QUICK_FILL_STORAGE_KEY = 'swimmingDiaryQuickFill';
    let quickFillTemplates = JSON.parse(localStorage.getItem(QUICK_FILL_STORAGE_KEY)) || [];
    const LAST_USED_TEMPLATE_KEY = 'swimmingDiaryQuickFillLastUsed';
    let lastUsedTemplateId = localStorage.getItem(LAST_USED_TEMPLATE_KEY) || '';

    const displayEntries = (entriesToDisplay = entries) => {
        entriesDiv.innerHTML = '';
        for (const [index, entry] of entriesToDisplay.entries()) {
            const entryDiv = document.createElement('div');
            entryDiv.classList.add('entry');
            entryDiv.innerHTML = `
                <h2>${entry.date}</h2>
                <h3>What I did:</h3>
                <p>${entry.did}</p>
                <h3>Problems met:</h3>
                <p>${entry.problems}</p>
                <h3>Possible Solution:</h3>
                <p>${entry.solutions}</p>
                <button onclick="editEntry(${entries.indexOf(entry)})">Edit</button>
                <button onclick="deleteEntry(${entries.indexOf(entry)})">Delete</button>
                <button onclick="exportEntry(${entries.indexOf(entry)})">Export Entry</button>
                <button onclick="shareEntry(${entries.indexOf(entry)})">Share Entry</button>
            `;
            entriesDiv.appendChild(entryDiv);
        }
    };

    const renderEntryList = (entriesToRender = entries) => {
        entryList.innerHTML = '';
        for (const entry of entriesToRender) {
            const listItem = document.createElement('li');
            listItem.textContent = entry.date;
            listItem.addEventListener('click', () => {
                displayEntries([entry]);
                // close the details dropdown
                entryList.parentElement.parentElement.open = false;
            });
            entryList.appendChild(listItem);
        }
    };

    const sortEntries = () => {
        entries.sort((a, b) => new Date(b.date) - new Date(a.date));
    };

    const persistQuickFillTemplates = () => {
        localStorage.setItem(QUICK_FILL_STORAGE_KEY, JSON.stringify(quickFillTemplates));
    };

    const renderQuickFillOptions = (preferredId = lastUsedTemplateId) => {
        quickFillSelect.innerHTML = '<option value="">-- Choose saved snippet --</option>';
        for (const template of quickFillTemplates) {
            const option = document.createElement('option');
            option.value = template.id;
            option.textContent = template.name;
            quickFillSelect.appendChild(option);
        }

        const hasTemplates = quickFillTemplates.length > 0;
        quickFillSelect.disabled = !hasTemplates;
        applyTemplateButton.disabled = !hasTemplates;
        deleteTemplateButton.disabled = !hasTemplates;

        const hasPreferred = Boolean(preferredId && quickFillTemplates.some(template => template.id === preferredId));
        quickFillSelect.value = hasPreferred ? preferredId : '';

        if (preferredId && !hasPreferred) {
            setLastUsedTemplate('');
        }
    };

    const getTemplateById = (id) => quickFillTemplates.find(template => template.id === id);

    const applyTemplateToFields = (template) => {
        if (!template) {
            return;
        }

        didInput.value = template.did;
        problemsInput.value = template.problems;
        didInput.focus();
    };

    const setLastUsedTemplate = (id) => {
        lastUsedTemplateId = id || '';
        if (lastUsedTemplateId) {
            localStorage.setItem(LAST_USED_TEMPLATE_KEY, lastUsedTemplateId);
        } else {
            localStorage.removeItem(LAST_USED_TEMPLATE_KEY);
        }
    };



    const init = () => {
        dateInput.valueAsDate = new Date();
        didInput.focus();
        sortEntries();
        if (entries.length > 0) {
            searchDateInput.value = entries[0].date;
        }
        displayEntries();
        renderEntryList();
        renderQuickFillOptions();
    }

    window.editEntry = (index) => {
        editIndex = index;
        const entry = entries[index];
        dateInput.value = entry.date;
        didInput.value = entry.did;
        problemsInput.value = entry.problems;
        solutionsInput.value = entry.solutions;
        submitButton.textContent = 'Save Changes';
        didInput.focus();
    };

    window.deleteEntry = (index) => {
        if (confirm('Are you sure you want to delete this entry?')) {
            entries.splice(index, 1);
            localStorage.setItem('swimmingDiary', JSON.stringify(entries));
            sortEntries();
            displayEntries();
            renderEntryList();
        }
    };

    window.exportEntry = (index) => {
        const entry = entries[index];
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entry, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", `swimming_diary_${entry.date}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const exportAllEntries = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href",     dataStr);
        downloadAnchorNode.setAttribute("download", "swimming_diary_all.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    window.shareEntry = (index) => {
        const entry = entries[index];
        const entryText = `What I did:\n${entry.did}\n\nProblems met:\n${entry.problems}\n\nPossible Solution:\n${entry.solutions}`;
        if (navigator.share) {
            navigator.share({
                title: `Swimming Diary - ${entry.date}`,
                text: entryText,
            })
            .catch(console.error);
        } else {
            navigator.clipboard.writeText(entryText)
            .then(() => alert('Entry copied to clipboard'))
            .catch(console.error);
        }
    };

    const shareAllEntries = () => {
        let allEntriesText = '';
        for (const entry of entries) {
            allEntriesText += `Date: ${entry.date}\nWhat I did: ${entry.did}\nProblems met: ${entry.problems}\nPossible Solution: ${entry.solutions}\n\n`;
        }

        if (navigator.share) {
            navigator.share({
                title: 'My Swimming Diary',
                text: allEntriesText,
            })
            .catch(console.error);
        } else {
            navigator.clipboard.writeText(allEntriesText)
            .then(() => alert('All entries copied to clipboard'))
            .catch(console.error);
        }
    };

    exportAllButton.addEventListener('click', exportAllEntries);
    shareAllButton.addEventListener('click', shareAllEntries);

    applyTemplateButton.addEventListener('click', () => {
        const template = getTemplateById(quickFillSelect.value);
        applyTemplateToFields(template);
        if (template) {
            setLastUsedTemplate(template.id);
        } else {
            setLastUsedTemplate('');
        }
    });

    quickFillSelect.addEventListener('change', () => {
        const template = getTemplateById(quickFillSelect.value);
        applyTemplateToFields(template);
        setLastUsedTemplate(template ? template.id : '');
    });

    saveTemplateButton.addEventListener('click', () => {
        const didValue = didInput.value.trim();
        const problemsValue = problemsInput.value.trim();

        if (!didValue && !problemsValue) {
            alert('Add content to "What I did" or "Problems met" before saving a snippet.');
            return;
        }

        const selectedId = quickFillSelect.value;
        const existingIndex = quickFillTemplates.findIndex(template => template.id === selectedId);
        const defaultNameSource = didValue || problemsValue || `Snippet ${quickFillTemplates.length + 1}`;
        const defaultName = existingIndex > -1 ? quickFillTemplates[existingIndex].name : defaultNameSource.split('\n')[0].slice(0, 50);
        const nameInput = prompt('Snippet name', defaultName || '');

        if (nameInput === null) {
            return;
        }

        const trimmedName = nameInput.trim();

        if (!trimmedName) {
            alert('Snippet name cannot be empty.');
            return;
        }

        let nextSelectedId = selectedId;

        if (existingIndex > -1) {
            quickFillTemplates[existingIndex] = {
                ...quickFillTemplates[existingIndex],
                name: trimmedName,
                did: didValue,
                problems: problemsValue,
            };
            nextSelectedId = quickFillTemplates[existingIndex].id;
        } else {
            const newTemplate = {
                id: Date.now().toString(36),
                name: trimmedName,
                did: didValue,
                problems: problemsValue,
            };
            quickFillTemplates.push(newTemplate);
            nextSelectedId = newTemplate.id;
        }

        persistQuickFillTemplates();
        setLastUsedTemplate(nextSelectedId);
        renderQuickFillOptions(nextSelectedId);
    });

    deleteTemplateButton.addEventListener('click', () => {
        const selectedId = quickFillSelect.value;
        if (!selectedId) {
            alert('Select a snippet to delete.');
            return;
        }

        const template = getTemplateById(selectedId);
        if (!template) {
            return;
        }

        if (!confirm(`Delete the snippet "${template.name}"?`)) {
            return;
        }

        quickFillTemplates = quickFillTemplates.filter(item => item.id !== selectedId);
        persistQuickFillTemplates();
        if (lastUsedTemplateId === selectedId) {
            setLastUsedTemplate('');
        }
        renderQuickFillOptions();
    });

    searchDateInput.addEventListener('input', (e) => {
        const searchDate = e.target.value;
        if (searchDate) {
            const filteredEntries = entries.filter(entry => entry.date === searchDate);
            renderEntryList(filteredEntries);
            displayEntries(filteredEntries);
        } else {
            renderEntryList();
            displayEntries();
        }
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const newEntry = {
            date: e.target.date.value,
            did: e.target.did.value,
            problems: problemsInput.value,
            solutions: solutionsInput.value,
        };

        if (editIndex > -1) {
            entries[editIndex] = newEntry;
            editIndex = -1;
        } else {
            entries.push(newEntry);
        }

        sortEntries();
        localStorage.setItem('swimmingDiary', JSON.stringify(entries));
        displayEntries();
        renderEntryList();
        form.reset();
        renderQuickFillOptions();
        dateInput.valueAsDate = new Date();
        didInput.focus();
        submitButton.textContent = 'Add Entry';
    });

    init();
});
