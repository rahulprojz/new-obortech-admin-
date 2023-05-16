const folder = [
  ///////////////// 1
  {
    id: 1,
    name: "fdgdfgdadd",
    subFolders: [
      {
        id: 2,
        name: "dsfdsf",
        parent: 1,
        projects: [
          {
            id: 3,
            parent: 2,
            project: { id: 1, name: "Project A" },
          },
          {
            id: 4,
            parent: 2,
            project: { id: 1, name: "Project A" },
          },
        ],
      },
      {
        id: 5,
        name: "Jalaj",
        parent: 1,
        projects: [
          {
            id: 15,
            parent: 5,
            project: { id: 1, name: "Project A" },
          },
        ],
      },
    ],

    projects: [],
  },
  ///////////////// 2
  {
    id: 9,
    name: "Folder Test",

    subFolders: [
      {
        id: 13,
        name: "Sub-2",
        parent: 9,

        projects: [
          { id: 14, parent: 13, project: { id: 1, name: "Project A" } },
        ],
      },
    ],

    projects: [
      {
        id: 10,
        name: null,
        parent: 9,

        project: { id: 1, name: "Project A" },
      },
    ],
  },
  ///////////////// 3
  {
    id: 6,
    name: "NewFolderTest1-V1",
    subFolders: [
      {
        name: "SubFolder",
        parent: 6,

        projects: [
          {
            id: 16,
            parent: 8,

            project: { id: 2, name: "sdsfd" },
          },
          {
            id: 17,
            parent: 8,

            project: { id: 3, name: "Jalaj" },
          },
        ],
      },
    ],
    projects: [
      {
        id: 11,
        name: null,
        parent: 6,

        project: { id: 3, name: "Jalaj" },
      },
    ],
  },
  ///////////////// 4
  {
    id: 12,
    name: "issue-fix-folder-",
    subFolders: [],
    projects: [],
  },
];
