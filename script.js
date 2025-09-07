document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('diary-form');
    const entriesDiv = document.getElementById('entries');
    const dateInput = document.getElementById('date');
    const didInput = document.getElementById('did');
    const exportAllButton = document.getElementById('export-all');
    const shareAllButton = document.getElementById('share-all');
    const searchDateInput = document.getElementById('search-date');
    const entryList = document.getElementById('entry-list');

    let entries = JSON.parse(localStorage.getItem('swimmingDiary')) || [];
    let editIndex = -1;

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

    

    const init = () => {
        dateInput.valueAsDate = new Date();
        didInput.focus();
        sortEntries();
        if (entries.length > 0) {
            searchDateInput.value = entries[0].date;
        }
        displayEntries();
        renderEntryList();
    }

    window.editEntry = (index) => {
        editIndex = index;
        const entry = entries[index];
        dateInput.value = entry.date;
        didInput.value = entry.did;
        document.getElementById('problems').value = entry.problems;
        document.getElementById('solutions').value = entry.solutions;
        form.querySelector('button').textContent = 'Save Changes';
        didInput.focus();
    };

    window.deleteEntry = (index) => {
        entries.splice(index, 1);
        localStorage.setItem('swimmingDiary', JSON.stringify(entries));
        sortEntries();
        displayEntries();
        renderEntryList();
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
            problems: e.target.problems.value,
            solutions: e.target.solutions.value,
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
        dateInput.valueAsDate = new Date();
        didInput.focus();
        form.querySelector('button').textContent = 'Add Entry';
    });

    init();
});