/* =========================================================
   BRAINZTORM
   app.js
========================================================= */


/* =========================================================
   STORAGE
========================================================= */

const STORAGE = {
    projects: "brainztorm_projects_v1",
    trash: "brainztorm_trash_v1",
    settings: "brainztorm_settings_v1"
};


const EMOJIS = [
    "💡","🧠","🚀","🌌","🔬",
    "🎨","🎮","🤖","🧪","📚",
    "🌱","⚡","🛸","🎵","💻",
    "🧩","🔥","🌈","🪐","👾",
    "🌟","🎯","🗺️","🏗️","💭"
];


const GROUP_ICONS = [
    "💡","❓","⭐","🧠","📌",
    "🧪","🔬","🎯","🚀","🧩",
    "📚","⚡","🌱","🎨","🛠️"
];


const ACCENTS = [
    ["purple", "#9b6cff"],
    ["blue", "#5b9cff"],
    ["cyan", "#42e8ff"],
    ["pink", "#ff62c8"],
    ["green", "#5ce1a6"],
    ["orange", "#ff9d5c"]
];


const RANDOM_NAMES = [
    "Jake Smith",
    "Jane Doe",
    "Alex Morgan",
    "Sam Carter",
    "Taylor Reed",
    "Jordan Blake",
    "Casey Parker",
    "Riley Brooks",
    "Avery Quinn",
    "Jamie Ellis"
];


/* =========================================================
   STATE
========================================================= */

let projects = load(STORAGE.projects, []);
let trash = load(STORAGE.trash, []);

let settings = load(
    STORAGE.settings,
    {
        nickname:
            RANDOM_NAMES[
                Math.floor(
                    Math.random() *
                    RANDOM_NAMES.length
                )
            ],

        accent: "#9b6cff",

        theme: "dark",

        motivation: true
    }
);


let currentProjectId = null;
let selectedGroupId = null;
let selectedProjectEmoji = "💡";
let selectedGroupIcon = "💡";


/* =========================================================
   HELPERS
========================================================= */

function load(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        return value
            ? JSON.parse(value)
            : fallback;

    } catch {

        return fallback;
    }
}


function save(key, value) {

    localStorage.setItem(
        key,
        JSON.stringify(value)
    );
}


function id() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2)
    );
}


function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function initials(name) {

    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0,2)
        .map(word => word[0])
        .join("")
        .toUpperCase();
}


/* =========================================================
   DEFAULT GROUPS
========================================================= */

function defaultGroups() {

    return [
        {
            id: id(),
            name: "Ideas",
            icon: "💡"
        },

        {
            id: id(),
            name: "Questions",
            icon: "❓"
        },

        {
            id: id(),
            name: "Possibilities",
            icon: "🌌"
        },

        {
            id: id(),
            name: "Next steps",
            icon: "🎯"
        },

        {
            id: id(),
            name: "References",
            icon: "📚"
        }
    ];
}


/* =========================================================
   PROJECT CREATION
========================================================= */

function createProject(
    name,
    description,
    emoji
) {

    if (projects.length >= 25) {

        toast(
            "You've reached the 25-workspace limit. Move something to Trash before creating another.",
            "warning",
            "Workspace limit"
        );

        return null;
    }


    const project = {

        id: id(),

        name:
            name.trim(),

        description:
            description.trim(),

        emoji:
            emoji || "💡",

        createdAt:
            Date.now(),

        updatedAt:
            Date.now(),

        ideas: [],

        groups:
            defaultGroups()
    };


    projects.unshift(project);

    save(
        STORAGE.projects,
        projects
    );

    renderAll();

    toast(
        `${project.name} is ready.`,
        "success",
        "Workspace created"
    );

    return project;
}


/* =========================================================
   DELETE PROJECT
========================================================= */

function deleteProject(projectId) {

    const index =
        projects.findIndex(
            p => p.id === projectId
        );

    if (index === -1) return;


    const project =
        projects.splice(index,1)[0];


    project.deletedAt =
        Date.now();


    trash.unshift(project);


    save(STORAGE.projects, projects);
    save(STORAGE.trash, trash);


    renderAll();


    toast(
        `"${project.name}" was moved to Trash.`,
        "success",
        "Moved to Trash"
    );
}


/* =========================================================
   RESTORE PROJECT
========================================================= */

function restoreProject(projectId) {

    const index =
        trash.findIndex(
            p => p.id === projectId
        );

    if (index === -1) return;


    if (projects.length >= 25) {

        toast(
            "You already have 25 active workspaces.",
            "warning",
            "Can't restore"
        );

        return;
    }


    const project =
        trash.splice(index,1)[0];


    delete project.deletedAt;


    projects.unshift(project);


    save(STORAGE.projects, projects);
    save(STORAGE.trash, trash);


    renderAll();


    toast(
        `"${project.name}" is back.`,
        "success",
        "Workspace restored"
    );
}


/* =========================================================
   PERMANENT DELETE
========================================================= */

function permanentlyDelete(projectId) {

    trash =
        trash.filter(
            p => p.id !== projectId
        );

    save(
        STORAGE.trash,
        trash
    );

    renderAll();

    toast(
        "That workspace has been permanently removed.",
        "warning",
        "Deleted permanently"
    );
}


/* =========================================================
   OPEN PROJECT
========================================================= */

function openProject(projectId) {

    const project =
        projects.find(
            p => p.id === projectId
        );

    if (!project) return;


    currentProjectId =
        projectId;

    selectedGroupId = null;


    populateWorkspace(project);

    showPage("workspace");
}


/* =========================================================
   CURRENT PROJECT
========================================================= */

function currentProject() {

    return projects.find(
        p => p.id === currentProjectId
    );
}


/* =========================================================
   POPULATE WORKSPACE
========================================================= */

function populateWorkspace(project) {

    document.getElementById(
        "workspaceTitleInput"
    ).value = project.name;


    document.getElementById(
        "workspaceDescriptionInput"
    ).value =
        project.description || "";


    document.getElementById(
        "workspaceEmojiButton"
    ).textContent =
        project.emoji;


    renderIdeas();
    renderGroups();

    updateWorkspaceEmojiPicker();
}


/* =========================================================
   SAVE WORKSPACE
========================================================= */

function saveCurrentWorkspace() {

    const project =
        currentProject();

    if (!project) return;


    const name =
        document.getElementById(
            "workspaceTitleInput"
        ).value.trim();


    const description =
        document.getElementById(
            "workspaceDescriptionInput"
        ).value.trim();


    if (!name) {

        inputError(
            document.getElementById(
                "workspaceTitleInput"
            )
        );

        toast(
            "Your workspace needs a name.",
            "warning",
            "Name missing"
        );

        return;
    }


    project.name = name;

    project.description =
        description;

    project.updatedAt =
        Date.now();


    save(
        STORAGE.projects,
        projects
    );


    renderAll();


    toast(
        "Your changes are safely saved.",
        "success",
        "Workspace updated"
    );
}


/* =========================================================
   IDEAS
========================================================= */

function addIdea(text) {

    const project =
        currentProject();

    if (!project) {

        toast(
            "Open a workspace first.",
            "warning"
        );

        return;
    }


    if (!text.trim()) {

        toast(
            "Even a tiny thought counts. Give us something to work with. 💭",
            "warning",
            "Blank idea"
        );

        return;
    }


    project.ideas.push({

        id: id(),

        text:
            text.trim(),

        groupId:
            selectedGroupId,

        createdAt:
            Date.now()
    });


    project.updatedAt =
        Date.now();


    save(
        STORAGE.projects,
        projects
    );


    renderIdeas();


    closeModal("ideaModal");


    toast(
        "Thought captured. ✦",
        "success",
        "Idea added"
    );
}


function deleteIdea(ideaId) {

    const project =
        currentProject();

    if (!project) return;


    project.ideas =
        project.ideas.filter(
            idea => idea.id !== ideaId
        );


    save(
        STORAGE.projects,
        projects
    );


    renderIdeas();


    toast(
        "The idea was removed from this workspace.",
        "success",
        "Idea deleted"
    );
}


/* =========================================================
   GROUPS
========================================================= */

function addGroup(name, icon) {

    const project =
        currentProject();

    if (!project) return;


    if (!name.trim()) {

        toast(
            "Give your group a name first.",
            "warning"
        );

        return;
    }


    project.groups.push({

        id: id(),

        name:
            name.trim(),

        icon:
            icon || "🗂️"
    });


    save(
        STORAGE.projects,
        projects
    );


    renderGroups();


    closeModal("groupModal");


    toast(
        `"${name.trim()}" is ready for organizing.`,
        "success",
        "Group created"
    );
}


function deleteGroup(groupId) {

    const project =
        currentProject();

    if (!project) return;


    const group =
        project.groups.find(
            g => g.id === groupId
        );


    if (!group) return;


    project.ideas.forEach(idea => {

        if (idea.groupId === groupId) {

            idea.groupId = null;
        }
    });


    project.groups =
        project.groups.filter(
            g => g.id !== groupId
        );


    save(
        STORAGE.projects,
        projects
    );


    renderGroups();
    renderIdeas();


    toast(
        `"${group.name}" was removed.`,
        "success"
    );
}


/* =========================================================
   RENDER IDEAS
========================================================= */

function renderIdeas() {

    const container =
        document.getElementById(
            "ideasList"
        );

    if (!container) return;


    const project =
        currentProject();


    if (!project) return;


    let ideas =
        [...project.ideas];


    if (selectedGroupId) {

        ideas =
            ideas.filter(
                idea =>
                    idea.groupId ===
                    selectedGroupId
            );
    }


    if (!ideas.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    💭
                </div>

                <strong>
                    Nothing here yet.
                </strong>

                <p>
                    That's okay.
                    Click "+ Idea" and start anywhere.
                </p>

            </div>

        `;

        return;
    }


    container.innerHTML =
        ideas.map(idea => `

            <article
                class="idea-card"
                draggable="true"
                data-idea-id="${idea.id}"
            >

                <div class="idea-bullet">
                    ✦
                </div>

                <div class="idea-body">

                    <p>
                        ${escapeHTML(idea.text)}
                    </p>

                    <small>
                        ${formatDate(idea.createdAt)}
                    </small>

                </div>

                <div class="idea-actions">

                    <button
                        title="Delete idea"
                        data-delete-idea="${idea.id}"
                    >
                        🗑
                    </button>

                </div>

            </article>

        `).join("");


    container
        .querySelectorAll(
            "[data-delete-idea]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    deleteIdea(
                        button.dataset.deleteIdea
                    );
                }
            );
        });


    setupIdeaDragging();
}


/* =========================================================
   GROUP RENDER
========================================================= */

function renderGroups() {

    const container =
        document.getElementById(
            "groupsList"
        );

    if (!container) return;


    const project =
        currentProject();

    if (!project) return;


    container.innerHTML = "";


    const all = document.createElement("div");

    all.className =
        "group-item " +
        (!selectedGroupId
            ? "active"
            : "");

    all.innerHTML = `

        <span class="group-icon">
            ✦
        </span>

        <span class="group-name">
            All thoughts
        </span>

        <span class="group-count">
            ${project.ideas.length}
        </span>

    `;


    all.addEventListener(
        "click",
        () => {

            selectedGroupId = null;

            renderGroups();
            renderIdeas();
        }
    );


    container.appendChild(all);


    project.groups.forEach(group => {

        const element =
            document.createElement("div");


        element.className =
            "group-item " +
            (
                selectedGroupId === group.id
                    ? "active"
                    : ""
            );


        const count =
            project.ideas.filter(
                idea =>
                    idea.groupId ===
                    group.id
            ).length;


        element.innerHTML = `

            <span class="group-icon">
                ${group.icon}
            </span>

            <span class="group-name">
                ${escapeHTML(group.name)}
            </span>

            <span class="group-count">
                ${count}
            </span>

            <button
                class="group-delete"
                title="Delete group"
            >
                ×
            </button>

        `;


        element.addEventListener(
            "click",
            event => {

                if (
                    event.target
                        .classList
                        .contains("group-delete")
                ) {

                    deleteGroup(group.id);

                    return;
                }


                selectedGroupId =
                    group.id;

                renderGroups();
                renderIdeas();
            }
        );


        container.appendChild(element);
    });
}


/* =========================================================
   DRAG IDEAS INTO GROUPS
========================================================= */

function setupIdeaDragging() {

    document
        .querySelectorAll(
            ".idea-card"
        )
        .forEach(card => {

            card.addEventListener(
                "dragstart",
                event => {

                    event.dataTransfer.setData(
                        "text/plain",
                        card.dataset.ideaId
                    );

                    card.style.opacity = ".5";
                }
            );


            card.addEventListener(
                "dragend",
                () => {

                    card.style.opacity = "";
                }
            );
        });


    document
        .querySelectorAll(
            ".group-item"
        )
        .forEach(group => {

            group.addEventListener(
                "dragover",
                event => {

                    event.preventDefault();

                    group.classList.add(
                        "active"
                    );
                }
            );


            group.addEventListener(
                "dragleave",
                () => {

                    if (
                        selectedGroupId !==
                        group.dataset.groupId
                    ) {
                        group.classList.remove(
                            "active"
                        );
                    }
                }
            );
        });
}


/* =========================================================
   EMOJIS
========================================================= */

function updateWorkspaceEmojiPicker() {

    const picker =
        document.getElementById(
            "emojiPicker"
        );

    if (!picker) return;


    const project =
        currentProject();

    if (!project) return;


    picker.innerHTML =
        EMOJIS.map(
            emoji => `

                <button
                    class="emoji-option ${
                        project.emoji === emoji
                            ? "selected"
                            : ""
                    }"
                    data-workspace-emoji="${emoji}"
                >
                    ${emoji}
                </button>

            `
        ).join("");


    picker
        .querySelectorAll(
            "[data-workspace-emoji]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    project.emoji =
                        button.dataset
                            .workspaceEmoji;

                    document
                        .getElementById(
                            "workspaceEmojiButton"
                        )
                        .textContent =
                        project.emoji;

                    save(
                        STORAGE.projects,
                        projects
                    );

                    updateWorkspaceEmojiPicker();
                }
            );
        });
}


/* =========================================================
   NAVIGATION
========================================================= */

function showPage(page) {

    document
        .querySelectorAll(".page")
        .forEach(element => {

            element.classList.remove(
                "active-page"
            );
        });


    const target =
        document.getElementById(
            `page-${page}`
        );


    if (!target) return;


    target.classList.add(
        "active-page"
    );


    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.toggle(
                "active",
                item.dataset.page === page
            );
        });


    const titles = {

        home:
            ["YOUR THINKING SPACE", "Welcome back."],

        workspaces:
            ["YOUR PROJECTS", "Workspaces"],

        workspace:
            ["ACTIVE PROJECT", "Workspace"],

        direction:
            ["THINKING ASSISTANT", "Direction"],

        research:
            ["KNOWLEDGE", "Research"],

        library:
            ["CURATED RESOURCES", "Library"],

        creative:
            ["COMMUNITY INSPIRATION", "Creative Flow"],

        trash:
            ["RECOVERY", "Trash"]
    };


    const title =
        titles[page] ||
        ["BRAINZTORM", "BRAINZTORM"];


    document.getElementById(
        "pageEyebrow"
    ).textContent =
        title[0];


    document.getElementById(
        "pageTitle"
    ).textContent =
        title[1];


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    renderAll();
}


/* =========================================================
   MODALS
========================================================= */

function openModal(id) {

    document
        .getElementById(id)
        ?.classList
        .remove("hidden");
}


function closeModal(id) {

    document
        .getElementById(id)
        ?.classList
        .add("hidden");
}


/* =========================================================
   TOAST
========================================================= */

function toast(
    message,
    type = "info",
    title = "Tiny thought"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


    const icons = {

        info: "💡",
        success: "✨",
        warning: "⚠️",
        error: "🚨"
    };


    const element =
        document.createElement("div");


    element.className =
        "toast";


    element.innerHTML = `

        <div class="toast-icon">
            ${icons[type] || "💡"}
        </div>

        <div class="toast-content">

            <div class="toast-title">
                ${escapeHTML(title)}
            </div>

            <div class="toast-message">
                ${escapeHTML(message)}
            </div>

        </div>

    `;


    container.appendChild(element);


    setTimeout(() => {

        element.classList.add(
            "removing"
        );

        setTimeout(
            () => element.remove(),
            300
        );

    }, 3500);
}


/* =========================================================
   INPUT ERROR
========================================================= */

function inputError(input) {

    if (!input) return;


    input.classList.add(
        "input-error"
    );


    input.focus();


    setTimeout(
        () =>
            input.classList.remove(
                "input-error"
            ),
        700
    );
}


/* =========================================================
   PERSONALIZATION
========================================================= */

function applySettings() {

    document.documentElement.style
        .setProperty(
            "--accent",
            settings.accent
        );


    applyTheme(
        settings.theme
    );


    const username =
        document.getElementById(
            "sidebarUsername"
        );


    if (username) {

        username.textContent =
            settings.nickname;
    }


    const avatar =
        document.getElementById(
            "userAvatar"
        );


    if (avatar) {

        avatar.textContent =
            initials(
                settings.nickname
            );
    }


    if (!settings.motivation) {

        document
            .getElementById(
                "personalizationBanner"
            )
            ?.classList.add(
                "hidden-banner"
            );
    }
}


function applyTheme(theme) {

    if (
        theme === "system"
    ) {

        const dark =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;


        document.documentElement
            .classList.toggle(
                "light-mode",
                !dark
            );

        return;
    }


    document.documentElement
        .classList.toggle(
            "light-mode",
            theme === "light"
        );
}


function setupPersonalization() {

    const nickname =
        document.getElementById(
            "nicknameInput"
        );


    nickname.value =
        settings.nickname;


    buildAccentPicker();


    document
        .querySelectorAll(
            ".theme-option"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.theme ===
                settings.theme
            );
        });


    document.getElementById(
        "motivationToggle"
    ).checked =
        settings.motivation;
}


function buildAccentPicker() {

    const container =
        document.getElementById(
            "accentPicker"
        );


    container.innerHTML =
        ACCENTS.map(
            ([name,color]) => `

                <button
                    class="accent accent-${name} ${
                        settings.accent === color
                            ? "selected"
                            : ""
                    }"
                    data-accent="${color}"
                    title="${name}"
                ></button>

            `
        ).join("");


    container
        .querySelectorAll(
            ".accent"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    settings.accent =
                        button.dataset.accent;

                    document
                        .querySelectorAll(
                            ".accent"
                        )
                        .forEach(
                            item =>
                                item.classList
                                    .remove(
                                        "selected"
                                    )
                        );

                    button.classList.add(
                        "selected"
                    );

                    applySettings();
                }
            );
        });
}


/* =========================================================
   DIRECTION
========================================================= */

function generateDirection() {

    const input =
        document.getElementById(
            "directionInput"
        );


    let text =
        input.value.trim();


    if (!text && currentProject()) {

        const project =
            currentProject();


        text = `
Project: ${project.name}

Description:
${project.description}

Ideas:
${project.ideas
    .map(
        idea => "- " + idea.text
    )
    .join("\n")}
        `.trim();
    }


    if (!text) {

        toast(
            "Give Direction something to think about first.",
            "warning",
            "We need a little context"
        );

        inputError(input);

        return;
    }


    const output =
        document.getElementById(
            "directionOutput"
        );


    const response =
        directionEngine(text);


    typeWriter(
        output,
        response
    );
}


/*
 * This is intentionally a local heuristic engine.
 *
 * It does NOT pretend to be a cloud AI model.
 * Later, if your teacher approves adding an API/backend,
 * this function can be replaced by an actual AI request.
 */

function directionEngine(text) {

    const lower =
        text.toLowerCase();


    const paths = [];


    if (
        lower.includes("game") ||
        lower.includes("app") ||
        lower.includes("website")
    ) {

        paths.push(
            "Prototype the smallest possible version first. Focus on one interaction that proves the idea is useful."
        );
    }


    if (
        lower.includes("science") ||
        lower.includes("research") ||
        lower.includes("experiment")
    ) {

        paths.push(
            "Turn the idea into a question you can actually test. Identify your variables, evidence and what would count as a useful result."
        );
    }


    if (
        lower.includes("story") ||
        lower.includes("book") ||
        lower.includes("character")
    ) {

        paths.push(
            "Try defining the central conflict before worrying about every detail. Ask what your character wants, what blocks them and what changes."
        );
    }


    if (
        lower.includes("business") ||
        lower.includes("product")
    ) {

        paths.push(
            "Identify the person who would benefit most. Then define the smallest version of the product that could solve one concrete problem for them."
        );
    }


    paths.push(
        "Split the idea into three layers: what you know, what you assume and what you still need to discover."
    );


    paths.push(
        "Choose one deliberately low-effort experiment. You don't need to commit to the final direction yet."
    );


    paths.push(
        "Write down the weirdest version of the idea too. Sometimes the strange version reveals the interesting part."
    );


    return `

🧭 DIRECTION

I looked at your idea as a starting point rather than a finished destination.

Here are some possible paths:

1. ${paths[0]}

2. ${paths[1]}

3. ${paths[2]}

💡 A useful next question:

"What would I still want to know if I had to explain this idea to someone who knew nothing about it?"

And remember:

You don't have to know yet.

If you're stuck, make the next action ridiculously small. Open a note. Sketch one box. Write one question. Find one source.

Momentum beats perfection.

    `.trim();
}


/* =========================================================
   TYPEWRITER
========================================================= */

function typeWriter(
    element,
    text,
    speed = 12
) {

    element.innerHTML = "";


    const textNode =
        document.createTextNode("");


    const cursor =
        document.createElement("span");


    cursor.className =
        "direction-cursor";


    element.appendChild(
        textNode
    );


    element.appendChild(
        cursor
    );


    let index = 0;


    function next() {

        if (
            index >=
            text.length
        ) {

            cursor.remove();

            return;
        }


        textNode.nodeValue +=
            text[index];


        const character =
            text[index];


        index++;


        let delay =
            speed *
            (
                .65 +
                Math.random() * .7
            );


        if (
            ".!?".includes(
                character
            )
        ) {

            delay =
                speed * 7;
        }


        if (
            character === ","
        ) {

            delay =
                speed * 2.5;
        }


        setTimeout(
            next,
            delay
        );
    }


    next();
}


/* =========================================================
   RESEARCH
========================================================= */


/*
 * These are curated starting points.
 *
 * A frontend-only application cannot safely crawl arbitrary
 * websites because of browser security/CORS restrictions.
 *
 * So BRAINZTORM gives the user actual source destinations
 * without falsely claiming that it scanned the websites.
 */

const SOURCES = [

    {
        icon: "🎓",
        title: "Khan Academy",
        description:
            "Free educational lessons and practice across many subjects.",
        tags:
            ["education","learning"]
    },

    {
        icon: "🧪",
        title: "NASA",
        description:
            "Space, science, engineering and exploration information.",
        tags:
            ["space","science","engineering"]
    },

    {
        icon: "📚",
        title: "Encyclopaedia Britannica",
        description:
            "Reference material covering a wide range of topics.",
        tags:
            ["history","science","general"]
    },

    {
        icon: "🔬",
        title: "PubMed",
        description:
            "A major database for biomedical and life-science literature.",
        tags:
            ["medicine","biology","science"]
    },

    {
        icon: "🏛️",
        title: "Library of Congress",
        description:
            "Primary-source collections, history and cultural materials.",
        tags:
            ["history","culture","primary sources"]
    },

    {
        icon: "🌍",
        title: "World Bank",
        description:
            "Development data, economic information and global indicators.",
        tags:
            ["economics","data","development"]
    },

    {
        icon: "📊",
        title: "Our World in Data",
        description:
            "Research and data visualizations on global issues.",
        tags:
            ["data","society","environment"]
    },

    {
        icon: "🧠",
        title: "Stanford Encyclopedia of Philosophy",
        description:
            "Expert-written reference articles in philosophy.",
        tags:
            ["philosophy","ideas"]
    }
];


function renderResearch(query = "") {

    const container =
        document.getElementById(
            "researchResults"
        );


    const search =
        query.toLowerCase();


    const results =
        SOURCES.filter(source => {

            if (!search)
                return true;


            return (
                source.title
                    .toLowerCase()
                    .includes(search)
                ||
                source.description
                    .toLowerCase()
                    .includes(search)
                ||
                source.tags.some(
                    tag =>
                        tag
                            .toLowerCase()
                            .includes(search)
                )
            );
        });


    container.innerHTML =
        results.map(
            source => `

                <article class="source-card">

                    <div class="source-icon">
                        ${source.icon}
                    </div>

                    <h3>
                        ${escapeHTML(source.title)}
                    </h3>

                    <p>
                        ${escapeHTML(source.description)}
                    </p>

                    <a
                        href="${sourceURL(source.title)}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Open source ↗
                    </a>

                </article>

            `
        ).join("");


    if (!results.length) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    🔎
                </div>

                <strong>
                    No matching sources yet.
                </strong>

                <p>
                    Try a broader research topic.
                </p>

            </div>
        `;
    }
}


function sourceURL(title) {

    const urls = {

        "Khan Academy":
            "https://www.khanacademy.org/",

        "NASA":
            "https://www.nasa.gov/",

        "Encyclopaedia Britannica":
            "https://www.britannica.com/",

        "PubMed":
            "https://pubmed.ncbi.nlm.nih.gov/",

        "Library of Congress":
            "https://www.loc.gov/",

        "World Bank":
            "https://www.worldbank.org/",

        "Our World in Data":
            "https://ourworldindata.org/",

        "Stanford Encyclopedia of Philosophy":
            "https://plato.stanford.edu/"
    };


    return urls[title] || "#";
}


/* =========================================================
   LIBRARY
========================================================= */

const LIBRARY = [

    {
        icon: "🧠",
        title: "How to brainstorm",
        description:
            "Generate many possibilities before judging them.",
        action:
            "Try writing ten terrible ideas before choosing one."
    },

    {
        icon: "🧩",
        title: "Break big problems down",
        description:
            "Turn overwhelming projects into smaller questions.",
        action:
            "Ask: what is the smallest part I can solve today?"
    },

    {
        icon: "🔬",
        title: "Think experimentally",
        description:
            "Use small tests instead of guessing.",
        action:
            "What could you test in less than an hour?"
    },

    {
        icon: "🌱",
        title: "Iterate",
        description:
            "Your first version does not have to be your final version.",
        action:
            "Make version one deliberately simple."
    },

    {
        icon: "❓",
        title: "Ask better questions",
        description:
            "Good questions often reveal the next step.",
        action:
            "Replace 'Is this good?' with 'What would make this better?'"
    },

    {
        icon: "💡",
        title: "When you're stuck",
        description:
            "Use constraints to restart creative momentum.",
        action:
            "Give yourself a strange limitation and see what happens."
    }
];


function renderLibrary() {

    const container =
        document.getElementById(
            "libraryGrid"
        );


    container.innerHTML =
        LIBRARY.map(
            item => `

                <article class="library-card">

                    <div class="library-icon">
                        ${item.icon}
                    </div>

                    <h3>
                        ${escapeHTML(item.title)}
                    </h3>

                    <p>
                        ${escapeHTML(item.description)}
                    </p>

                    <button
                        class="chip"
                        data-library-action="${escapeHTML(item.action)}"
                    >
                        Try this →
                    </button>

                </article>

            `
        ).join("");
}


/* =========================================================
   CREATIVE FLOW
========================================================= */

const CREATIVE = [

    {
        icon: "🚀",
        title: "The 10-minute invention",
        description:
            "Invent something that solves an extremely small problem.",
        prompt:
            "What annoying thing happens every day that could be made 10% easier?"
    },

    {
        icon: "🌌",
        title: "Impossible city",
        description:
            "Design a city that breaks one ordinary rule of reality.",
        prompt:
            "What rule does your city break, and how does society adapt?"
    },

    {
        icon: "🤖",
        title: "Helpful machine",
        description:
            "Imagine a machine designed to help students think.",
        prompt:
            "What would it do without doing the thinking for them?"
    },

    {
        icon: "🎮",
        title: "Game mechanic",
        description:
            "Invent one game mechanic nobody has seen before.",
        prompt:
            "What does the player do, and why would it feel satisfying?"
    },

    {
        icon: "🧪",
        title: "Strange experiment",
        description:
            "Design an experiment that answers a surprisingly simple question.",
        prompt:
            "What would you measure?"
    },

    {
        icon: "📖",
        title: "Story from an object",
        description:
            "Choose an ordinary object and give it a secret history.",
        prompt:
            "Who owned it first, and why does it matter now?"
    }
];


function renderCreative() {

    const container =
        document.getElementById(
            "creativeGrid"
        );


    container.innerHTML =
        CREATIVE.map(
            item => `

                <article class="creative-card">

                    <div class="creative-icon">
                        ${item.icon}
                    </div>

                    <h3>
                        ${escapeHTML(item.title)}
                    </h3>

                    <p>
                        ${escapeHTML(item.description)}
                    </p>

                    <button
                        class="chip creative-prompt"
                        data-prompt="${escapeHTML(item.prompt)}"
                    >
                        Explore ✦
                    </button>

                </article>

            `
        ).join("");
}


/* =========================================================
   RENDER WORKSPACES
========================================================= */

function projectCard(project, inTrash = false) {

    return `

        <article
            class="workspace-card"
            data-project-id="${project.id}"
        >

            <button
                class="card-delete"
                data-project-delete="${project.id}"
                title="${
                    inTrash
                        ? "Permanently delete"
                        : "Move to trash"
                }"
            >
                ${
                    inTrash
                        ? "×"
                        : "🗑"
                }
            </button>

            <div class="workspace-emoji">
                ${project.emoji}
            </div>

            <h3>
                ${escapeHTML(project.name)}
            </h3>

            <p>
                ${
                    escapeHTML(
                        project.description ||
                        "No description yet."
                    )
                }
            </p>

            <div class="workspace-meta">

                <span>
                    💭 ${project.ideas.length}
                </span>

                <span>
                    🗂 ${project.groups.length}
                </span>

                <span>
                    ${formatDate(project.updatedAt)}
                </span>

            </div>

            ${
                inTrash
                    ? `
                        <button
                            class="chip restore-project"
                            data-restore="${project.id}"
                        >
                            Restore
                        </button>
                    `
                    : ""
            }

        </article>
    `;
}


function renderWorkspaceGrid() {

    const home =
        document.getElementById(
            "homeWorkspaceGrid"
        );


    const grid =
        document.getElementById(
            "workspaceGrid"
        );


    if (!projects.length) {

        const empty = `

            <div class="empty-state">

                <div class="empty-icon">
                    🌱
                </div>

                <strong>
                    Your thinking universe is empty.
                </strong>

                <p>
                    Create your first workspace.
                    It doesn't have to be perfect.
                </p>

            </div>
        `;


        home.innerHTML = empty;
        grid.innerHTML = empty;

    } else {

        home.innerHTML =
            projects
                .slice(0,4)
                .map(p => projectCard(p))
                .join("");


        grid.innerHTML =
            projects
                .map(p => projectCard(p))
                .join("");
    }


    setupProjectCards();


    document.getElementById(
        "projectCount"
    ).textContent =
        projects.length;


    document.getElementById(
        "projectProgress"
    ).style.width =
        `${(projects.length / 25) * 100}%`;
}


/* =========================================================
   TRASH RENDER
========================================================= */

function renderTrash() {

    const grid =
        document.getElementById(
            "trashGrid"
        );


    document.getElementById(
        "trashCount"
    ).textContent =
        trash.length;


    if (!trash.length) {

        grid.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    🗑️
                </div>

                <strong>
                    Trash is empty.
                </strong>

                <p>
                    Deleted workspaces will appear here.
                </p>

            </div>

        `;

        return;
    }


    grid.innerHTML =
        trash
            .map(
                project =>
                    projectCard(
                        project,
                        true
                    )
            )
            .join("");


    grid
        .querySelectorAll(
            "[data-restore]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    restoreProject(
                        button.dataset.restore
                    );
                }
            );
        });


    grid
        .querySelectorAll(
            "[data-project-delete]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    permanentlyDelete(
                        button.dataset.projectDelete
                    );
                }
            );
        });
}


/* =========================================================
   PROJECT CARD EVENTS
========================================================= */

function setupProjectCards() {

    document
        .querySelectorAll(
            ".workspace-card[data-project-id]"
        )
        .forEach(card => {

            card.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            ".card-delete"
                        )
                    ) return;

                    if (
                        event.target.closest(
                            ".restore-project"
                        )
                    ) return;


                    openProject(
                        card.dataset.projectId
                    );
                }
            );
        });


    document
        .querySelectorAll(
            "[data-project-delete]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.stopPropagation();

                    deleteProject(
                        button.dataset.projectDelete
                    );
                }
            );
        });
}


/* =========================================================
   DATE
========================================================= */

function formatDate(timestamp) {

    if (!timestamp)
        return "Recently";


    const date =
        new Date(timestamp);


    const diff =
        Date.now() -
        timestamp;


    if (
        diff <
        60 * 60 * 1000
    ) {

        return "Just now";
    }


    if (
        diff <
        24 * 60 * 60 * 1000
    ) {

        return "Today";
    }


    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric"
        }
    );
}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderAll() {

    renderWorkspaceGrid();
    renderTrash();
    renderLibrary();
    renderCreative();
    renderResearch();


    if (currentProjectId) {

        const project =
            currentProject();

        if (project) {

            populateWorkspace(
                project
            );
        }
    }
}


/* =========================================================
   PROJECT MODAL
========================================================= */

function setupProjectModal() {

    const picker =
        document.getElementById(
            "projectEmojiPicker"
        );


    picker.innerHTML =
        EMOJIS.map(
            emoji => `

                <button
                    class="emoji-option ${
                        emoji === "💡"
                            ? "selected"
                            : ""
                    }"
                    data-project-emoji="${emoji}"
                >
                    ${emoji}
                </button>

            `
        ).join("");


    picker
        .querySelectorAll(
            "[data-project-emoji]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectedProjectEmoji =
                        button.dataset.projectEmoji;


                    picker
                        .querySelectorAll(
                            ".emoji-option"
                        )
                        .forEach(
                            item =>
                                item.classList
                                    .remove(
                                        "selected"
                                    )
                        );


                    button.classList.add(
                        "selected"
                    );
                }
            );
        });
}


/* =========================================================
   GROUP MODAL
========================================================= */

function setupGroupModal() {

    const picker =
        document.getElementById(
            "groupIconPicker"
        );


    picker.innerHTML =
        GROUP_ICONS.map(
            icon => `

                <button
                    class="group-icon ${
                        icon === "💡"
                            ? "selected"
                            : ""
                    }"
                    data-group-icon="${icon}"
                >
                    ${icon}
                </button>

            `
        ).join("");


    picker
        .querySelectorAll(
            "[data-group-icon]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectedGroupIcon =
                        button.dataset.groupIcon;


                    picker
                        .querySelectorAll(
                            ".group-icon"
                        )
                        .forEach(
                            item =>
                                item.classList
                                    .remove(
                                        "selected"
                                    )
                        );


                    button.classList.add(
                        "selected"
                    );
                }
            );
        });
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {


    /* Navigation */

    document
        .querySelectorAll(
            "[data-page]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button.dataset.page
                    );
                }
            );
        });


    /* New project */

    [
        "quickNew",
        "heroNewProject",
        "workspaceNew"
    ].forEach(idName => {

        document
            .getElementById(idName)
            ?.addEventListener(
                "click",
                () => {

                    if (
                        projects.length >= 25
                    ) {

                        toast(
                            "You've reached the 25-workspace limit.",
                            "warning",
                            "Workspace limit"
                        );

                        return;
                    }


                    openModal(
                        "projectModal"
                    );
                }
            );
    });


    /* Spark */

    document
        .getElementById(
            "heroSpark"
        )
        ?.addEventListener(
            "click",
            () => {

                if (!currentProjectId) {

                    if (!projects.length) {

                        openModal(
                            "projectModal"
                        );

                        toast(
                            "Let's create a workspace first, then we'll give your spark somewhere to land.",
                            "info"
                        );

                        return;
                    }


                    currentProjectId =
                        projects[0].id;
                }


                openModal(
                    "ideaModal"
                );
            }
        );


    /* Personalization */

    document
        .getElementById(
            "openPersonalization"
        )
        ?.addEventListener(
            "click",
            () => {

                setupPersonalization();

                openModal(
                    "personalizationModal"
                );
            }
        );


    document
        .getElementById(
            "personalizeFromBanner"
        )
        ?.addEventListener(
            "click",
            () => {

                setupPersonalization();

                openModal(
                    "personalizationModal"
                );
            }
        );


    document
        .getElementById(
            "closePersonalization"
        )
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "personalizationModal"
                )
        );


    /* Save personalization */

    document
        .getElementById(
            "savePersonalization"
        )
        ?.addEventListener(
            "click",
            () => {

                const input =
                    document.getElementById(
                        "nicknameInput"
                    );


                const nickname =
                    input.value.trim();


                if (!nickname) {

                    inputError(input);

                    toast(
                        "Give yourself a nickname first.",
                        "warning"
                    );

                    return;
                }


                settings.nickname =
                    nickname;


                settings.motivation =
                    document.getElementById(
                        "motivationToggle"
                    ).checked;


                save(
                    STORAGE.settings,
                    settings
                );


                applySettings();


                document
                    .getElementById(
                        "personalizationBanner"
                    )
                    ?.classList.add(
                        "hidden-banner"
                    );


                closeModal(
                    "personalizationModal"
                );


                toast(
                    `Nice to meet you, ${nickname}.`,
                    "success",
                    "Personalization saved"
                );
            }
        );


    /* Themes */

    document
        .querySelectorAll(
            ".theme-option"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    settings.theme =
                        button.dataset.theme;


                    save(
                        STORAGE.settings,
                        settings
                    );


                    applySettings();


                    document
                        .querySelectorAll(
                            ".theme-option"
                        )
                        .forEach(
                            item =>
                                item.classList.toggle(
                                    "active",
                                    item.dataset.theme ===
                                    settings.theme
                                )
                        );
                }
            );
        });


    /* Theme shortcut */

    document
        .getElementById(
            "themeToggle"
        )
        ?.addEventListener(
            "click",
            () => {

                settings.theme =
                    settings.theme === "dark"
                        ? "light"
                        : "dark";


                save(
                    STORAGE.settings,
                    settings
                );


                applySettings();
            }
        );


    /* Create project */

    document
        .getElementById(
            "createProject"
        )
        ?.addEventListener(
            "click",
            () => {

                const nameInput =
                    document.getElementById(
                        "projectNameInput"
                    );


                const descriptionInput =
                    document.getElementById(
                        "projectDescriptionInput"
                    );


                const name =
                    nameInput.value.trim();


                if (!name) {

                    inputError(
                        nameInput
                    );

                    toast(
                        "Your project needs a name before we can create it.",
                        "warning",
                        "Whoa, hold on!"
                    );

                    return;
                }


                const project =
                    createProject(
                        name,
                        descriptionInput.value,
                        selectedProjectEmoji
                    );


                if (project) {

                    nameInput.value = "";

                    descriptionInput.value = "";

                    selectedProjectEmoji =
                        "💡";

                    closeModal(
                        "projectModal"
                    );

                    openProject(
                        project.id
                    );
                }
            }
        );


    /* Idea modal */

    document
        .getElementById(
            "addIdea"
        )
        ?.addEventListener(
            "click",
            () =>
                openModal(
                    "ideaModal"
                )
        );


    document
        .getElementById(
            "saveIdea"
        )
        ?.addEventListener(
            "click",
            () => {

                addIdea(
                    document.getElementById(
                        "ideaInput"
                    ).value
                );
            }
        );


    document
        .querySelectorAll(
            "[data-idea-template]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const input =
                        document.getElementById(
                            "ideaInput"
                        );


                    if (
                        input.value.trim()
                    ) {

                        input.value +=
                            " " +
                            button.dataset
                                .ideaTemplate;

                    } else {

                        input.value =
                            button.dataset
                                .ideaTemplate;
                    }


                    input.focus();
                }
            );
        });


    /* Groups */

    document
        .getElementById(
            "addGroup"
        )
        ?.addEventListener(
            "click",
            () => {

                setupGroupModal();

                openModal(
                    "groupModal"
                );
            }
        );


    document
        .getElementById(
            "createGroup"
        )
        ?.addEventListener(
            "click",
            () => {

                addGroup(
                    document.getElementById(
                        "groupNameInput"
                    ).value,

                    selectedGroupIcon
                );
            }
        );


    /* Emoji */

    document
        .getElementById(
            "workspaceEmojiButton"
        )
        ?.addEventListener(
            "click",
            () => {

                document
                    .getElementById(
                        "emojiPicker"
                    )
                    .classList.toggle(
                        "open"
                    );
            }
        );


    /* Save workspace */

    document
        .getElementById(
            "saveWorkspace"
        )
        ?.addEventListener(
            "click",
            saveCurrentWorkspace
        );


    /* Back */

    document
        .getElementById(
            "backToWorkspaces"
        )
        ?.addEventListener(
            "click",
            () =>
                showPage(
                    "workspaces"
                )
        );


    /* Direction */

    document
        .getElementById(
            "runDirection"
        )
        ?.addEventListener(
            "click",
            generateDirection
        );


    document
        .querySelectorAll(
            "[data-direction-prompt]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    document.getElementById(
                        "directionInput"
                    ).value =
                        button.dataset
                            .directionPrompt;
                }
            );
        });


    /* Workspace tools */

    document
        .querySelectorAll(
            "[data-workspace-tool]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showPage(
                        button.dataset
                            .workspaceTool
                    );
                }
            );
        });


    /* Research */

    document
        .getElementById(
            "researchButton"
        )
        ?.addEventListener(
            "click",
            () => {

                renderResearch(
                    document.getElementById(
                        "researchQuery"
                    ).value
                );
            }
        );


    document
        .getElementById(
            "researchQuery"
        )
        ?.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Enter"
                ) {

                    renderResearch(
                        event.target.value
                    );
                }
            }
        );


    /* Empty trash */

    document
        .getElementById(
            "emptyTrash"
        )
        ?.addEventListener(
            "click",
            () => {

                if (!trash.length) {

                    toast(
                        "Trash is already empty.",
                        "info"
                    );

                    return;
                }


                trash = [];


                save(
                    STORAGE.trash,
                    trash
                );


                renderAll();


                toast(
                    "Trash has been emptied.",
                    "success"
                );
            }
        );


    /* Library actions */

    document
        .getElementById(
            "libraryGrid"
        )
        ?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        "[data-library-action]"
                    );


                if (!button) return;


                toast(
                    button.dataset.libraryAction,
                    "info",
                    "Try this"
                );
            }
        );


    /* Creative Flow */

    document
        .getElementById(
            "creativeGrid"
        )
        ?.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        ".creative-prompt"
                    );


                if (!button) return;


                openModal(
                    "ideaModal"
                );


                document.getElementById(
                    "ideaInput"
                ).value =
                    button.dataset.prompt;
            }
        );


    /* Modal backdrop closing */

    document
        .querySelectorAll(
            ".modal-backdrop"
        )
        .forEach(backdrop => {

            backdrop.addEventListener(
                "click",
                () => {

                    const modal =
                        backdrop.parentElement;


                    modal.classList.add(
                        "hidden"
                    );
                }
            );
        });


    /* Close buttons */

    document
        .getElementById(
            "closeProjectModal"
        )
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "projectModal"
                )
        );


    document
        .getElementById(
            "closeIdeaModal"
        )
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "ideaModal"
                )
        );


    document
        .getElementById(
            "closeGroupModal"
        )
        ?.addEventListener(
            "click",
            () =>
                closeModal(
                    "groupModal"
                )
        );


    /* Keyboard shortcut */

    document.addEventListener(
        "keydown",
        event => {

            if (
                (event.ctrlKey ||
                event.metaKey) &&
                event.key === "k"
            ) {

                event.preventDefault();

                openModal(
                    "projectModal"
                );
            }


            if (
                event.key === "Escape"
            ) {

                document
                    .querySelectorAll(
                        ".modal:not(.hidden)"
                    )
                    .forEach(
                        modal =>
                            modal.classList
                                .add(
                                    "hidden"
                                )
                    );
            }
        }
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

function init() {

    applySettings();

    setupEvents();

    setupProjectModal();

    setupPersonalization();

    renderAll();


    /*
     * First-run experience.
     */

    const firstRun =
        !localStorage.getItem(
            "brainztorm_seen_v1"
        );


    if (firstRun) {

        localStorage.setItem(
            "brainztorm_seen_v1",
            "true"
        );


        setTimeout(() => {

            toast(
                `Welcome, ${settings.nickname}. Start anywhere — even if you don't know what you're doing yet.`,
                "info",
                "Welcome to BRAINZTORM"
            );

        }, 700);
    }
}


init();
