# WeeklyTaskWizard

## Overview

This is a Chrome extension that generates a Slack message containing a report of Jira tasks. You can add tasks to different categories, view a preview of the tasks, and copy the raw text to your clipboard.

## Features

- Add tasks to different categories (Tâches, Review MR, Autre)
- View a preview of the tasks with links to Jira issues
- Copy the raw text to your clipboard
- Clear all tasks with a single click

## Instructions

1. Install the Chrome extension by navigating to chrome://extensions and dragging the "popup" folder onto the page.
2. Navigate to a Jira issue page.
3. Click the "Add Current Page" button to add the issue to the appropriate category.
4. Choose the appropriate category from the dropdown menu to preview the tasks.
5. Click the "Copy" button to copy the raw text to your clipboard.
6. Paste your Slack message into the appropriate channel.
7. Click the "Clear Tasks" button to clear all tasks.

> :warning: **Links in Slack**: In order for the Jira issue links to properly work, make sure that your Slack workspace is in Markdown mode. To switch to Markdown mode, go to your workspace preferences, navigate to "Advanced" > "Input options" , and select "Format messages with markup".

## Code

The code for this extension is available on [GitHub](https://github.com/agerard57/Chrome_Weekly-Task-Wizard).

## License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
