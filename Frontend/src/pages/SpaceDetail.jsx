import { useState, useEffect } from "react";
import api from "../api/axios";
import { ChevronLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import SummaryTab from "../components/SummaryTab";
import BacklogTab from "../components/BacklogTab";
import SprintsTab from "../components/SprintsTab";
import BoardTab from "../components/BoardTab";
import CalendarTab from "../components/CalendarTab";
import MembersTab from "../components/MembersTab";
import AddMemberModal from "../components/AddMemberModal";
import "../styles/spaceDetail.css";

export default function SpaceDetail() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get space ID from URL
  const [activeTab, setActiveTab] = useState("summary");

  const [expandedSprintIds, setExpandedSprintIds] = useState(() => new Set([1, 2]));
  
  // Drag and drop state
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);

  // Board data in state so it can be updated
  const [boardData, setBoardData] = useState({
    todo: [
      { id: 1, title: "Research motor specifications", label: "research", points: 3, date: "Mar 15", assignee: "AS" },
      { id: 2, title: "Design chassis blueprint", label: "design", points: 5, date: "Mar 15", assignee: "MK" },
      { id: 3, title: "Order 3D printing filament", label: "procurement", points: null, date: null, assignee: null },
      { id: 4, title: "Write sensor integration tests", label: "testing", points: 3, date: null, assignee: null },
      { id: 5, title: "Design power distribution board", label: "hardware", points: 5, date: null, assignee: "RJ" },
      { id: 6, title: "Implement PID controller", label: "code", points: 8, date: null, assignee: null },
    ],
    inprogress: [
      { id: 7, title: "Program Arduino control logic", label: "code", points: 8, date: null, assignee: "JD" },
      { id: 8, title: "Solder sensor array PCB", label: "hardware", points: 5, date: null, assignee: "AS" },
    ],
    review: [
      { id: 9, title: "Test ultrasonic sensor accuracy", label: "testing", points: 3, date: null, assignee: "MK" },
    ],
    done: [
      { id: 10, title: "Set up GitHub repository", label: "setup", points: 1, date: null, assignee: "JD" },
      { id: 11, title: "Create project timeline", label: "planning", points: 2, date: null, assignee: "RJ" },
    ],
  });

  // Drag and drop handlers
  const handleDragStart = (e, card, fromColumn) => {
    setDraggedCard(card);
    setDraggedFrom(fromColumn);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    e.currentTarget.classList.add("drag-over");
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };

  const handleDrop = (e, toColumn) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    if (!draggedCard || !draggedFrom || draggedFrom === toColumn) {
      setDraggedCard(null);
      setDraggedFrom(null);
      return;
    }

    // Remove from source column
    const newBoardData = { ...boardData };
    newBoardData[draggedFrom] = newBoardData[draggedFrom].filter(
      (card) => card.id !== draggedCard.id
    );

    // Add to destination column
    newBoardData[toColumn] = [...newBoardData[toColumn], draggedCard];

    setBoardData(newBoardData);
    setDraggedCard(null);
    setDraggedFrom(null);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove("dragging");
    setDraggedCard(null);
    setDraggedFrom(null);
  };

  const [projectData, setProjectData] = useState({});
  const fetchProjectDetails = async () => {
    try {
      const res = await api.get(`/projects/${id}`);

      setProjectData({
        name: res.data.name,
        members: res.data.member_count,
      });

    } catch (err) {
      console.error("Error fetching project:", err);
    }
  };
  useEffect(() => {
    fetchMembers();
    fetchProjectDetails();
  }, [id]);

  const taskStats = {
    total: 11,
    done: 2,
    inProgress: 3,
    toDo: 6,
  };

  const tasks = [
    { id: 1, name: "Write sensor integration tests", label: "testing", points: 3 },
    { id: 2, name: "Design power distribution board", label: "hardware", points: 5, assignee: "RJ" },
    { id: 3, name: "Implement PID controller", label: "code", points: 8 },
  ];

  const backlogItems = [
    { id: 1, name: "Write sensor integration tests", label: "testing", points: 3 },
    { id: 2, name: "Design power distribution board", label: "hardware", points: 5 },
    { id: 3, name: "Implement PID controller", label: "code", points: 8 },
  ];

  const sprintTasksById = {
    1: boardData.done.map((t) => ({ ...t, status: "done" })),
    2: [
      ...boardData.todo.slice(0, 3).map((t) => ({ ...t, status: "todo" })),
      ...boardData.inprogress.slice(0, 2).map((t) => ({ ...t, status: "inprogress" })),
      ...boardData.review.slice(0, 1).map((t) => ({ ...t, status: "review" })),
    ],
    3: [],
  };

  const sprints = [
    {
      id: 1,
      name: "Sprint 1 - Foundation",
      date: "Feb 1 - Feb 14",
      status: "COMPLETED",
      goal: "Set up project and basic structure",
    },
    {
      id: 2,
      name: "Sprint 2 - Core Build",
      date: "Feb 15 - Feb 28",
      status: "ACTIVE",
      goal: "Build core hardware and software",
    },
    {
      id: 3,
      name: "Sprint 3 - Testing",
      date: "Mar 1 - Mar 14",
      status: "PLANNED",
      goal: "Validate performance and reliability",
    },
  ].map((s) => ({ ...s, tasks: sprintTasksById[s.id]?.length ?? 0 }));

  const toggleSprintExpanded = (sprintId) => {
    setExpandedSprintIds((prev) => {
      const next = new Set(prev);
      if (next.has(sprintId)) next.delete(sprintId);
      else next.add(sprintId);
      return next;
    });
  };

  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const fetchMembers = async () => {
  try {
    setLoadingMembers(true);

    const res = await api.get(`/projects/${id}/members`);

    // Format for UI
    const formattedMembers = res.data.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      initials: member.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase(),
      avatar: member.avatar || null,
    }));

      setMembers(formattedMembers);

    } catch (err) {
      console.error("Error fetching members:", err);
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };
  useEffect(() => {
    fetchMembers();
  }, [id]);

  const handleAddMember = async () => {
    try {
      setAdding(true);

      await api.post(`/projects/${id}/add-member`, { email ,role});

      setEmail("");
      setRole("worker");
      setShowModal(false);
      

      // refresh members
      fetchMembers();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error adding member");
    } finally {
      setAdding(false);
    }
  };
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);

  const [role, setRole] = useState("worker"); // default

  const taskAssignment = [
    { name: "John Doe", tasks: 2, percentage: 18 },
    { name: "Alice Smith", tasks: 2, percentage: 18 },
    { name: "Mike Kumar", tasks: 2, percentage: 18 },
    { name: "Raj Joshi", tasks: 2, percentage: 18 },
    { name: "Unassigned", tasks: 3, percentage: 27 },
  ];

  return (
    <div className="layout">
      <Navbar />
      <div className="main">
        <Sidebar />
        <div className="space-detail-container">
          {/* Header */}
          <div className="space-detail-header">
            <div className="header-top">
              <button
                className="back-button"
                onClick={() => navigate("/spaces")}
              >
                <ChevronLeft size="1.25rem" />
              </button>
              <div className="header-title">
                <h1>{projectData.name}</h1>
                <p>{projectData.members} Members</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
              {["summary", "backlog", "sprints", "board", "calendar", "members"].map((tab) => (
                <button
                  key={tab}
                  className={`tab ${activeTab === tab ? "active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-detail-content">
            {activeTab === "summary" && <SummaryTab taskStats={taskStats} taskAssignment={taskAssignment} />}
            {activeTab === "backlog" && <BacklogTab backlogItems={backlogItems} />}
            {activeTab === "sprints" && (
              <SprintsTab
                sprints={sprints}
                expandedSprintIds={expandedSprintIds}
                toggleSprintExpanded={toggleSprintExpanded}
                sprintTasksById={sprintTasksById}
              />
            )}
            {activeTab === "board" && (
              <BoardTab
                boardData={boardData}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
                handleDragEnd={handleDragEnd}
              />
            )}
            {activeTab === "calendar" && <CalendarTab />}
            {activeTab === "members" && (
              <MembersTab
                members={members}
                loadingMembers={loadingMembers}
                onAddMemberClick={() => setShowModal(true)}
              />
            )}

            <AddMemberModal
              showModal={showModal}
              email={email}
              role={role}
              adding={adding}
              onEmailChange={setEmail}
              onRoleChange={setRole}
              onCancel={() => setShowModal(false)}
              onAdd={handleAddMember}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
