let taskLists = {};

const checkJiraPage = (callback) => {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        const pageUrl = tabs[0].url;
        const jiraUrlRegex = /https?:\/\/[^/]*\.atlassian\.net\/(?:(?:jira\/)?(?:browse\/)?|(?:jira\/)?(?:software\/c\/projects\/\w+\/boards\/\d+\?modal=detail&selectedIssue=)?)(\w+-\d+)/;
        const match = pageUrl.match(jiraUrlRegex);
        callback(match);
    });
}

const init = () => {
    chrome.storage.sync.get("taskLists", (data) => {
        if (data.taskLists) {
            taskLists = data.taskLists;
        }
        updateAll();
    });

    checkJiraPage((match) => {
        const addTaskButton = document.getElementById("add-task");
        if (!match) {
            addTaskButton.disabled = true;
        } else {
            addTaskButton.disabled = false;
        }
    });
}



const displayErrorMessage = (message) => {
    const errorMessage = document.querySelector(".error-message");
    errorMessage.classList.remove("hidden");
    errorMessage.innerHTML = message;

    setTimeout(() => {
        errorMessage.classList.add("hidden");
        errorMessage.innerHTML = "";
    }, 3000);
}


const formattedDate = () => {
    const date = new Date();
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
    return `Semaine du ${formattedDate}`;
}
const copyMessage = () => {

    const messageOutput = document.getElementById("message-output");
    messageOutput.select();
    document.execCommand("copy");

    const copyButton = document.getElementById("copy-message");
    copyButton.textContent = "Copied!";
    setTimeout(() => {
        copyButton.textContent = "Copy";
    }, 1000);
}

const generateMessagePreview = () => {
    const messagePreview = document.getElementById("message-preview");
    messagePreview.innerHTML = "";

    const previewHeading = document.createElement("h2");
    previewHeading.textContent = "Preview:";
    messagePreview.appendChild(previewHeading);

    const previewList = document.createElement("ul");

    const dateItem = document.createElement("h3");
    dateItem.textContent = formattedDate();
    previewList.appendChild(dateItem);

    for (let taskType in taskLists) {
        if (taskLists.hasOwnProperty(taskType)) {
            const tasks = taskLists[taskType];

            if (tasks.length > 0) {
                const categoryItem = document.createElement("h4");
                categoryItem.textContent = taskType + ":";
                previewList.appendChild(categoryItem);

                tasks.forEach((task) => {
                    const issueKey = task.taskNumber;
                    const title = task.taskName;
                    const baseUrl = task.baseUrl;
                    const link = issueKey ? `${baseUrl}/browse/${issueKey}` : task.baseUrl;

                    const taskListItem = document.createElement("li");

                    if (issueKey) {
                        const issueKeyElement = document.createElement("a");
                        issueKeyElement.setAttribute("href", link);
                        issueKeyElement.setAttribute("target", "_blank");
                        issueKeyElement.textContent = issueKey;
                        taskListItem.appendChild(issueKeyElement);
                        taskListItem.innerHTML += " - ";
                    }

                    const titleElement = document.createElement("i");
                    titleElement.textContent = title;

                    if (baseUrl && !issueKey) {
                        const taskLink = document.createElement("a");
                        taskLink.setAttribute("href", link);
                        taskLink.setAttribute("target", "_blank");
                        taskLink.appendChild(titleElement);
                        taskListItem.appendChild(taskLink);
                    } else {
                        taskListItem.appendChild(titleElement);
                    }

                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "Delete";
                    deleteButton.classList.add("delete-button");
                    deleteButton.addEventListener("click", () => {
                        taskLists[taskType] = taskLists[taskType].filter(t => t !== task);
                        chrome.storage.sync.set({ taskLists }, () => {
                            updateAll();
                        });
                    });


                    taskListItem.appendChild(deleteButton);
                    previewList.appendChild(taskListItem);
                });
            }
        }
    }

    if (previewList.childElementCount === 0) {
        const previewItem = document.createElement("li");
        previewItem.textContent = "No tasks added";
        previewList.appendChild(previewItem);
    }

    messagePreview.appendChild(previewList);
}


const generateRawOutput = () => {
    let message = formattedDate() + "\n\n";

    for (let taskType in taskLists) {
        if (taskLists.hasOwnProperty(taskType)) {
            const tasks = taskLists[taskType];

            if (tasks.length > 0) {
                message += `*${taskType}:*\n`;

                for (let task of tasks) {
                    const issueKey = task.taskNumber;
                    const title = task.taskName;
                    const baseUrl = task.baseUrl;

                    if (issueKey && baseUrl) {
                        const url = `${baseUrl}/browse/${issueKey}`;
                        message += `[${issueKey}](${url}) - _${title}_\n`;
                    } else if (baseUrl) {
                        message += `_[${title}](${baseUrl})_\n`;
                    } else {
                        message += `_${title}_\n`;
                    }
                }

                message += "\n";
            }
        }
    }

    const messageOutput = document.getElementById("message-output");
    messageOutput.value = message.trim();
}


const addCurrentPage = () => {
    checkJiraPage((match) => {
        if (!match) {
            displayErrorMessage("Current page is not a Jira issue.");
            return;
        }

        const pageUrl = match.input;
        const issueKey = match[1];
        const baseUrl = pageUrl.substring(0, pageUrl.indexOf('/browse'));

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            chrome.scripting.executeScript({
                target: { tabId: activeTab.id },
                func: () => {
                    return document.getElementsByTagName('h1')[0].innerText.toString();
                }
            }, (result) => {
                const title = result[0].result || "";
                const taskType = document.getElementById("task-type").value;

                if (!taskLists.hasOwnProperty(taskType)) {
                    taskLists[taskType] = [];
                }

                const task = {
                    baseUrl: baseUrl,
                    taskName: title,
                    taskNumber: issueKey
                };

                const taskExists = taskLists[taskType].some(existingTask => (
                    existingTask.baseUrl === task.baseUrl &&
                    existingTask.taskName === task.taskName &&
                    existingTask.taskNumber === task.taskNumber
                ));

                if (!taskExists) {
                    taskLists[taskType].push(task);
                } else {
                    displayErrorMessage("Task already exists.");
                }

                chrome.storage.sync.set({
                    taskLists
                }, () => {
                    updateAll();
                });
            });
        });
    });
}

const addCustomTask = () => {
    const taskName = document.getElementById("custom-task-name").value;
    const taskLink = document.getElementById("custom-task-link").value.trim();

    if (taskName.trim() === "") {
        displayErrorMessage("Custom task name cannot be empty.");
        return;
    }

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }

    const taskType = document.getElementById("task-type").value;

    if (!taskLists.hasOwnProperty(taskType)) {
        taskLists[taskType] = [];
    }

    const task = {
        baseUrl: isValidUrl(taskLink) ? taskLink : "",
        taskName: taskName,
        taskNumber: "",
    };

    const taskExists = taskLists[taskType].some(existingTask => (
        existingTask.baseUrl === task.baseUrl &&
        existingTask.taskName === task.taskName));

    if (!taskExists) {
        taskLists[taskType].push(task);

        chrome.storage.sync.set({
            taskLists
        }, () => {
            updateAll();
        });
    } else {
        displayErrorMessage("Custom task already exists.");
    }
}


const updateAll = () => {
    updateMessagePreview();
    updateRawOutput();
};
const updateMessagePreview = () => {
    generateMessagePreview();
}
const updateRawOutput = () => {
    generateRawOutput();
}
const clearTasks = () => {
    taskLists = {};
    chrome.storage.sync.set({
        taskLists
    }, () => {
        updateAll();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("add-task").addEventListener("click", addCurrentPage);
    document.getElementById("add-custom-task").addEventListener("click", addCustomTask);
    document.getElementById("clear-tasks").addEventListener("click", clearTasks);
    document.getElementById("copy-message").addEventListener("click", copyMessage);
    document.getElementById("task-type").addEventListener("change", () => {

        updateMessagePreview();
    });

    updateMessagePreview();
    updateRawOutput();

    init();
});
