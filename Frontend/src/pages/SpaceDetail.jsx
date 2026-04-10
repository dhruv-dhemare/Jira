import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import { ChevronLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { getSocket } from "../socket/socket";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import SummaryTab from "../components/SummaryTab";
import BacklogTab from "../components/BacklogTab";
import SprintsTab from "../components/SprintsTab";
import BoardTab from "../components/BoardTab";
import CalendarTab from "../components/CalendarTab";
import MembersTab from "../components/MembersTab";
import AddMemberModal from "../components/AddMemberModal";
import AddSprintModal from "../components/AddSprintModal";
import "../styles/spaceDetail.css";

export default function SpaceDetail() {
  const navigate = useNavigate();
  const { id } = useParams(); // Get space ID from URL
  const [activeTab, setActiveTab] = useState("summary");

  const [expandedSprintIds, setExpandedSprintIds] = useState(() => new Set([1, 2]));
  
  // Drag and drop state
  const [draggedCard, setDraggedCard] = useState(null);
  const [draggedFrom, setDraggedFrom] = useState(null);
  
  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const [savingTask, setSavingTask] = useState(false);

  // Current user state
  const [currentUser, setCurrentUser] = useState(null);

  // Delete project state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);

  // Add task modal state
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    description: "",
    assignedTo: null,
    deadline: "",
    sprintId: null,
  });
  const [creatingTask, setCreatingTask] = useState(false);

  // Board data in state so it can be updated
  const [boardData, setBoardData] = useState({
    todo: [],
    inprogress: [],
    review: [],
    done: [],
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

    // Role-based restrictions for workers
    if (currentUser && currentUser.role === "worker") {
      // Workers can only move tasks between todo and review columns
      const isValidMove = 
        (draggedFrom === "todo" && toColumn === "review") || 
        (draggedFrom === "review" && toColumn === "todo");
      
      if (!isValidMove) {
        alert("Workers can only move tasks between TO DO and IN REVIEW");
        setDraggedCard(null);
        setDraggedFrom(null);
        return;
      }
    }

    // Update local state immediately (optimistic update)
    const newBoardData = { ...boardData };
    newBoardData[draggedFrom] = newBoardData[draggedFrom].filter(
      (card) => card.id !== draggedCard.id
    );
    newBoardData[toColumn] = [...newBoardData[toColumn], draggedCard];
    setBoardData(newBoardData);

    // Map column keys to API status values
    const statusMap = {
      todo: "Todo",
      inprogress: "In Progress",
      review: "In Review",
      done: "Done",
    };

    // Call API to update task status in backend
    const newStatus = statusMap[toColumn];
    updateTaskStatus(draggedCard.id, newStatus);

    setDraggedCard(null);
    setDraggedFrom(null);
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, {
        status: newStatus,
      });
    } catch (err) {
      console.error("Error updating task status:", err);
      // Revert the change if API fails
      fetchTasks();
    }
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove("dragging");
    setDraggedCard(null);
    setDraggedFrom(null);
  };

  const handleTaskClick = (task) => {
    // Fallback for getting assignee name from members
    let assigneeName = task.assigneeName;
    if (!assigneeName && task.id) {
      const assigneeObj = members.find(m => m.initials === task.assignee);
      if (assigneeObj) {
        assigneeName = assigneeObj.name;
      }
    }

    setSelectedTask({
      ...task,
      assigneeName: assigneeName || "Unassigned",
    });
    
    // Initialize editedTask with the same data
    setEditedTask({
      title: task.title,
      description: task.description || "",
      assigned_to: task.assigned_to || null,
      deadline: task.deadline ? task.deadline.split('T')[0] : "",
    });
    
    setIsEditingTask(false);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    try {
      await api.delete(`/tasks/${taskId}`);
      setShowTaskModal(false);
      setSelectedTask(null);
      fetchTasks(); // Refresh tasks list
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task. Please try again.");
    }
  };

  const handleEditTask = async () => {
    if (!editedTask.title.trim()) {
      alert("Task title is required");
      return;
    }

    try {
      setSavingTask(true);

      const response = await api.put(`/tasks/${selectedTask.id}`, {
        title: editedTask.title,
        description: editedTask.description,
        assigned_to: editedTask.assigned_to,
        deadline: editedTask.deadline || null,
      });

      // Update selectedTask with the new data
      setSelectedTask({
        ...selectedTask,
        title: response.data.title,
        description: response.data.description,
        assigned_to: response.data.assigned_to,
        deadline: response.data.deadline,
      });

      setIsEditingTask(false);
      fetchTasks(); // Refresh tasks list
      alert("Task updated successfully");
    } catch (err) {
      console.error("Error updating task:", err);
      alert(err.response?.data?.error || "Failed to update task. Please try again.");
    } finally {
      setSavingTask(false);
    }
  };

  const handleOpenAddTaskModal = (columnKey) => {
    setSelectedColumn(columnKey);
    setShowAddTaskModal(true);
  };

  const handleAddTask = async () => {
    if (!newTaskForm.title.trim()) {
      alert("Task title is required");
      return;
    }

    try {
      setCreatingTask(true);

      // Map column keys to API status values
      const statusMap = {
        todo: "Todo",
        inprogress: "In Progress",
        review: "In Review",
        done: "Done",
      };

      const response = await api.post("/tasks", {
        title: newTaskForm.title,
        description: newTaskForm.description,
        projectId: id,
        assignedTo: newTaskForm.assignedTo,
        deadline: newTaskForm.deadline || null,
        sprintId: newTaskForm.sprintId,
        status: statusMap[selectedColumn],
      });

      // Reset form
      setNewTaskForm({
        title: "",
        description: "",
        assignedTo: null,
        deadline: "",
        sprintId: null,
      });
      setShowAddTaskModal(false);
      setSelectedColumn(null);

      // Refresh tasks
      fetchTasks();
    } catch (err) {
      console.error("Error creating task:", err);
      alert(err.response?.data?.error || "Failed to create task. Please try again.");
    } finally {
      setCreatingTask(false);
    }
  };

  // Transform fetched tasks into board data organized by status
  const organizeBoardData = (tasks, membersList) => {
    const organized = {
      todo: [],
      inprogress: [],
      review: [],
      done: [],
    };

    tasks.forEach((task) => {
      // Map API status to board column key
      let statusKey = "todo";
      const taskStatus = task.status || "Todo"; // Ensure we have a status value
      
      if (taskStatus === "In Review") statusKey = "review";
      else if (taskStatus === "In Progress") statusKey = "inprogress";
      else if (taskStatus === "Done") statusKey = "done";

      // Find assignee initials and name
      let assigneeInitials = null;
      let assigneeName = null;
      if (task.assigned_to) {
        const assignee = membersList.find(m => m.id === task.assigned_to);
        if (assignee) {
          assigneeInitials = assignee.initials || null;
          assigneeName = assignee.name || null;
        }
      }

      // Format deadline
      const deadline = task.deadline
        ? new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : null;

      // Find sprint name if task has sprint_id
      let sprintName = null;
      if (task.sprint_id) {
        const sprint = sprintsData.find(s => s.id === task.sprint_id);
        if (sprint) {
          sprintName = sprint.name;
        }
      }

      organized[statusKey].push({
        id: task.id,
        title: task.title,
        description: task.description,
        date: deadline,
        assignee: assigneeInitials,
        assigneeName: assigneeName,
        status: taskStatus,
        assigned_to: task.assigned_to,
        deadline: task.deadline,
        sprint_id: task.sprint_id,
        sprintName: sprintName,
      });
    });

    return organized;
  };

  const [projectData, setProjectData] = useState({});
  const [tasksData, setTasksData] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [sprintsData, setSprintsData] = useState([]);
  const [loadingSprints, setLoadingSprints] = useState(true);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [role, setRole] = useState("worker"); // default

  // Sprint Modal States
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [sprintStartDate, setSprintStartDate] = useState("");
  const [sprintEndDate, setSprintEndDate] = useState("");
  const [sprintGoal, setSprintGoal] = useState("");
  const [creatingSprint, setCreatingSprint] = useState(false);

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

  const fetchTasks = async () => {
    try {
      setLoadingTasks(true);
      const res = await api.get(`/tasks/${id}`);
      setTasksData(res.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setTasksData([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchSprints = async () => {
    try {
      setLoadingSprints(true);
      const res = await api.get(`/sprints/${id}`);
      setSprintsData(res.data);
    } catch (err) {
      console.error("Error fetching sprints:", err);
      setSprintsData([]);
    } finally {
      setLoadingSprints(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/users/me");
      setCurrentUser(res.data);
    } catch (err) {
      console.error("Error fetching current user:", err);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchMembers();
    fetchProjectDetails();
    fetchTasks();
    fetchSprints();
  }, [id]);

  // Update board data when tasks or members change
  useEffect(() => {
    if (tasksData.length > 0 && members.length > 0) {
      const organized = organizeBoardData(tasksData, members);
      setBoardData(organized);
    }
  }, [tasksData, members, sprintsData]);

  // Real-time updates via WebSocket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Join project room
    socket.emit("joinProject", { projectId: id }, (response) => {
      if (response?.error) {
        console.error("Error joining project:", response.error);
      } else {
        console.log("✅ Joined project room:", id);
      }
    });

    // Task Created
    const handleTaskCreated = (taskData) => {
      console.log("📝 Task created:", taskData);
      fetchTasks();
    };

    // Task Updated
    const handleTaskUpdated = (updatedTask) => {
      console.log("✏️ Task updated:", updatedTask);
      setTasksData(prev =>
        prev.map(t => t.id === updatedTask.id ? updatedTask : t)
      );
    };

    // Task Deleted
    const handleTaskDeleted = ({ taskId }) => {
      console.log("🗑️ Task deleted:", taskId);
      setTasksData(prev => prev.filter(t => t.id !== taskId));
    };

    // Sprint Created
    const handleSprintCreated = (sprintData) => {
      console.log("➕ Sprint created:", sprintData);
      fetchSprints();
    };

    // Sprint Updated
    const handleSprintUpdated = (updatedSprint) => {
      console.log("✏️ Sprint updated:", updatedSprint);
      setSprintsData(prev =>
        prev.map(s => s.id === updatedSprint.id ? updatedSprint : s)
      );
    };

    // Sprint Deleted
    const handleSprintDeleted = ({ sprintId }) => {
      console.log("🗑️ Sprint deleted:", sprintId);
      setSprintsData(prev => prev.filter(s => s.id !== sprintId));
    };

    // Member Added
    const handleMemberAdded = ({ userId }) => {
      console.log("👤 Member added:", userId);
      fetchMembers();
    };

    // Member Role Changed
    const handleMemberRoleChanged = ({ userId, role }) => {
      console.log("👑 Member role changed:", userId, "=>", role);
      fetchMembers();
    };

    // Subscribe to events
    socket.on("taskCreated", handleTaskCreated);
    socket.on("taskUpdated", handleTaskUpdated);
    socket.on("taskDeleted", handleTaskDeleted);
    socket.on("sprintCreated", handleSprintCreated);
    socket.on("sprintUpdated", handleSprintUpdated);
    socket.on("sprintDeleted", handleSprintDeleted);
    socket.on("memberAdded", handleMemberAdded);
    socket.on("memberRoleChanged", handleMemberRoleChanged);

    // Cleanup - unsubscribe from events and leave room
    return () => {
      socket.off("taskCreated", handleTaskCreated);
      socket.off("taskUpdated", handleTaskUpdated);
      socket.off("taskDeleted", handleTaskDeleted);
      socket.off("sprintCreated", handleSprintCreated);
      socket.off("sprintUpdated", handleSprintUpdated);
      socket.off("sprintDeleted", handleSprintDeleted);
      socket.off("memberAdded", handleMemberAdded);
      socket.off("memberRoleChanged", handleMemberRoleChanged);
      socket.emit("leaveProject", { projectId: id });
    };
  }, [id]);

  // Calculate taskStats from fetched tasks
  const taskStats = {
    total: tasksData.length,
    done: tasksData.filter(t => t.status === "Done").length,
    inProgress: tasksData.filter(t => t.status === "In Review").length,
    toDo: tasksData.filter(t => t.status === "Todo").length,
  };

  // Calculate progress percentages
  const total = taskStats.total || 1;
  const progressPercentages = {
    done: Math.round((taskStats.done / total) * 100),
    inProgress: Math.round((taskStats.inProgress / total) * 100),
    toDo: Math.round((taskStats.toDo / total) * 100),
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

  // Function to get backlog tasks with past deadlines
  const getBacklogTasks = () => {
    if (loadingTasks || loadingMembers) {
      return [];
    }

    const now = new Date();
    
    return tasksData
      .filter(task => {
        // Include tasks in backlog/todo status
        const isBacklogStatus = task.status === "Todo";
        
        // Check if task has a past deadline
        let isPastDeadline = false;
        if (task.deadline) {
          const deadline = new Date(task.deadline);
          isPastDeadline = deadline < now;
        }
        
        return isBacklogStatus && isPastDeadline;
      })
      .map(task => {
        // Find assignee name
        const assignee = members.find(m => m.id === task.assigned_to);
        
        return {
          id: task.id,
          name: task.title,
          label: task.description || "task",
          assignee: assignee?.name || null,
          deadline: task.deadline,
        };
      });
  };

  const sprintTasksById = useMemo(() => {
    return tasksData.reduce((acc, task) => {
      if (task.sprint_id) {
        if (!acc[task.sprint_id]) {
          acc[task.sprint_id] = [];
        }
        acc[task.sprint_id].push({
          id: task.id,
          title: task.title,
          label: task.description || "task",
          points: null,
          status: task.status.toLowerCase() === "done" ? "done" : 
                  task.status.toLowerCase() === "in review" ? "review" :
                  task.status.toLowerCase() === "inprogress" ? "inprogress" : "todo",
          assignee: task.assigned_to ? 
            members.find(m => m.id === task.assigned_to)?.initials : null,
          deadline: task.deadline,
        });
      }
      return acc;
    }, {});
  }, [tasksData, members]);

  const getSprintStatus = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < now) return "COMPLETED";
    if (start <= now && now <= end) return "ACTIVE";
    return "PLANNED";
  };

  const formatSprintDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const startStr = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endStr = end.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    return `${startStr} - ${endStr}`;
  };

  // Transform fetched sprints data to display format
  const transformedSprints = sprintsData.map((sprint) => ({
    id: sprint.id,
    name: sprint.name,
    date: formatSprintDateRange(sprint.start_date, sprint.end_date),
    status: getSprintStatus(sprint.start_date, sprint.end_date),
    goal: sprint.goal || "No goal set",
  }));

  const sprints = transformedSprints.reverse().map((s) => ({ ...s, tasks: sprintTasksById[s.id]?.length ?? 0 }));

  const toggleSprintExpanded = (sprintId) => {
    setExpandedSprintIds((prev) => {
      const next = new Set(prev);
      if (next.has(sprintId)) next.delete(sprintId);
      else next.add(sprintId);
      return next;
    });
  };

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

  const handleCreateSprint = async () => {
    try {
      // Validate required fields
      if (!sprintName.trim()) {
        alert("Sprint name is required");
        return;
      }
      if (!sprintStartDate || !sprintEndDate) {
        alert("Start and end dates are required");
        return;
      }

      setCreatingSprint(true);

      await api.post(`/sprints`, {
        name: sprintName,
        startDate: sprintStartDate,
        endDate: sprintEndDate,
        goal: sprintGoal,
        projectId: id,
      });

      // Reset form
      setSprintName("");
      setSprintStartDate("");
      setSprintEndDate("");
      setSprintGoal("");
      setShowSprintModal(false);

      // Refresh sprints
      fetchSprints();

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error creating sprint");
    } finally {
      setCreatingSprint(false);
    }
  };

  const handleDeleteSprint = async (sprintId) => {
    try {
      await api.delete(`/sprints/${sprintId}`);
      
      // Refresh sprints
      fetchSprints();
      
      // Remove expanded state if the sprint was expanded
      setExpandedSprintIds(prev => {
        const next = new Set(prev);
        next.delete(sprintId);
        return next;
      });

    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error deleting sprint");
    }
  };

  const handleDeleteProject = async () => {
    try {
      setDeletingProject(true);
      await api.delete(`/projects/${id}`);
      alert("Project deleted successfully");
      navigate("/spaces");
    } catch (err) {
      console.error("Error deleting project:", err);
      const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message || "Failed to delete project";
      alert(`Failed to delete project: ${errorMsg}`);
    } finally {
      setDeletingProject(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      await api.delete(`/projects/${id}/members/${memberId}`);
      alert("Member removed successfully");
      // Refresh members list
      fetchMembers();
    } catch (err) {
      console.error("Error deleting member:", err);
      const errorMsg = err.response?.data?.error || err.message || "Failed to remove member";
      alert(`Failed to remove member: ${errorMsg}`);
    }
  };

  // Calculate taskAssignment grouped by assignee
  const getTaskAssignment = () => {
    const assignmentMap = {};
    
    tasksData.forEach(task => {
      if (task.assigned_to) {
        // Find member by id
        const member = members.find(m => m.id === task.assigned_to);
        
        if (member) {
          // Group by email (unique identifier) instead of name
          const email = member.email;
          
          if (!assignmentMap[email]) {
            assignmentMap[email] = {
              name: member.name,
              tasks: 0
            };
          }
          assignmentMap[email].tasks++;
        }
      }
    });

    // Add unassigned count
    const unassignedCount = tasksData.filter(t => !t.assigned_to).length;
    if (unassignedCount > 0) {
      assignmentMap["unassigned"] = {
        name: "Unassigned",
        tasks: unassignedCount
      };
    }

    // Convert to array format and calculate percentages
    const total = tasksData.length || 1;
    const taskAssignmentArray = Object.entries(assignmentMap).map(([email, data]) => ({
      name: data.name,
      tasks: data.tasks,
      percentage: Math.round((data.tasks / total) * 100),
    }));

    return taskAssignmentArray;
  };

  const taskAssignment = getTaskAssignment();

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
            <div className="tabs-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "1rem" }}>
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
              
              {currentUser && ["manager", "master"].includes(currentUser.role) && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    padding: "0.5rem 1rem",
                    background: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    fontSize: "0.9rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Delete Project
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="space-detail-content">
            {activeTab === "summary" && <SummaryTab taskStats={taskStats} taskAssignment={taskAssignment} progressPercentages={progressPercentages} />}
            {activeTab === "backlog" && <BacklogTab backlogItems={getBacklogTasks()} />}
            {activeTab === "sprints" && (
              <SprintsTab
                sprints={sprints}
                expandedSprintIds={expandedSprintIds}
                toggleSprintExpanded={toggleSprintExpanded}
                sprintTasksById={sprintTasksById}
                onCreateSprintClick={() => setShowSprintModal(true)}
                onDeleteSprint={handleDeleteSprint}
                currentUser={currentUser}
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
                onTaskClick={handleTaskClick}
                onAddTaskClick={handleOpenAddTaskModal}
                currentUser={currentUser}
              />
            )}
            {activeTab === "calendar" && <CalendarTab tasksData={tasksData} />}
            {activeTab === "members" && (
              <MembersTab
                members={members}
                loadingMembers={loadingMembers}
                onAddMemberClick={() => setShowModal(true)}
                currentUser={currentUser}
                onDeleteMember={handleDeleteMember}
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

            <AddSprintModal
              showModal={showSprintModal}
              name={sprintName}
              startDate={sprintStartDate}
              endDate={sprintEndDate}
              goal={sprintGoal}
              creating={creatingSprint}
              onNameChange={setSprintName}
              onStartDateChange={setSprintStartDate}
              onEndDateChange={setSprintEndDate}
              onGoalChange={setSprintGoal}
              onCancel={() => {
                setShowSprintModal(false);
                setSprintName("");
                setSprintStartDate("");
                setSprintEndDate("");
                setSprintGoal("");
              }}
              onCreate={handleCreateSprint}
            />

            {/* Task Detail Modal */}
            {showTaskModal && selectedTask && (
              <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    {isEditingTask ? (
                      <input
                        type="text"
                        value={editedTask.title}
                        onChange={(e) =>
                          setEditedTask({ ...editedTask, title: e.target.value })
                        }
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          padding: "0.5rem",
                          width: "100%",
                        }}
                      />
                    ) : (
                      <h2>{selectedTask.title}</h2>
                    )}
                    <button
                      className="modal-close"
                      onClick={() => {
                        setShowTaskModal(false);
                        setIsEditingTask(false);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    {isEditingTask ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                            Description
                          </label>
                          <textarea
                            placeholder="Task description"
                            value={editedTask.description}
                            onChange={(e) =>
                              setEditedTask({ ...editedTask, description: e.target.value })
                            }
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-md)",
                              fontSize: "1rem",
                              minHeight: "100px",
                              fontFamily: "inherit",
                            }}
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                            Assign to
                          </label>
                          <select
                            value={editedTask.assigned_to || ""}
                            onChange={(e) =>
                              setEditedTask({
                                ...editedTask,
                                assigned_to: e.target.value ? parseInt(e.target.value) : null,
                              })
                            }
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-md)",
                              fontSize: "1rem",
                            }}
                          >
                            <option value="">Unassigned</option>
                            {members.map((member) => (
                              <option key={member.id} value={member.id}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                            Deadline
                          </label>
                          <input
                            type="date"
                            value={editedTask.deadline}
                            onChange={(e) =>
                              setEditedTask({ ...editedTask, deadline: e.target.value })
                            }
                            style={{
                              width: "100%",
                              padding: "0.75rem",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-md)",
                              fontSize: "1rem",
                            }}
                          />
                        </div>

                        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                          <button
                            onClick={() => {
                              setIsEditingTask(false);
                              // Reset editedTask to original values
                              setEditedTask({
                                title: selectedTask.title,
                                description: selectedTask.description || "",
                                assigned_to: selectedTask.assigned_to || null,
                                deadline: selectedTask.deadline ? selectedTask.deadline.split('T')[0] : "",
                              });
                            }}
                            style={{
                              padding: "0.75rem 1.5rem",
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-md)",
                              fontSize: "1rem",
                              cursor: "pointer",
                              background: "var(--bg)",
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleEditTask}
                            disabled={savingTask || !editedTask.title.trim()}
                            style={{
                              padding: "0.75rem 1.5rem",
                              background: "var(--primary)",
                              color: "white",
                              border: "none",
                              borderRadius: "var(--radius-md)",
                              fontSize: "1rem",
                              cursor: savingTask || !editedTask.title.trim() ? "not-allowed" : "pointer",
                              opacity: savingTask || !editedTask.title.trim() ? 0.6 : 1,
                            }}
                          >
                            {savingTask ? "Saving..." : "Save Changes"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {selectedTask.description && (
                          <p className="modal-description">{selectedTask.description}</p>
                        )}
                        <div className="modal-info">
                          <div className="info-row">
                            <label>Deadline:</label>
                            <span>{selectedTask.date || "No deadline"}</span>
                          </div>
                          <div className="info-row">
                            <label>Assigned to:</label>
                            <span>{selectedTask.assigneeName || "Unassigned"}</span>
                          </div>
                          {selectedTask.sprintName && (
                            <div className="info-row">
                              <label>Sprint:</label>
                              <span>{selectedTask.sprintName}</span>
                            </div>
                          )}
                        </div>
                        <div className="modal-actions">
                          {currentUser && ["manager", "master"].includes(currentUser.role) && (
                            <button
                              className="btn-edit"
                              onClick={() => setIsEditingTask(true)}
                              style={{
                                padding: "0.75rem 1.5rem",
                                background: "var(--primary)",
                                color: "white",
                                border: "none",
                                borderRadius: "var(--radius-md)",
                                fontSize: "1rem",
                                cursor: "pointer",
                                marginRight: "0.5rem",
                              }}
                            >
                              Edit Task
                            </button>
                          )}
                          {currentUser && ["manager", "master"].includes(currentUser.role) && (
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteTask(selectedTask.id)}
                              style={{
                                padding: "0.75rem 1.5rem",
                                background: "#dc2626",
                                color: "white",
                                border: "none",
                                borderRadius: "var(--radius-md)",
                                fontSize: "1rem",
                                cursor: "pointer",
                              }}
                            >
                              Delete Task
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Add Task Modal */}
            {showAddTaskModal && (
              <div className="modal-overlay" onClick={() => setShowAddTaskModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Add New Task</h2>
                    <button
                      className="modal-close"
                      onClick={() => setShowAddTaskModal(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                          Title *
                        </label>
                        <input
                          type="text"
                          placeholder="Task title"
                          value={newTaskForm.title}
                          onChange={(e) =>
                            setNewTaskForm({ ...newTaskForm, title: e.target.value })
                          }
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "1rem",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                          Description
                        </label>
                        <textarea
                          placeholder="Task description"
                          value={newTaskForm.description}
                          onChange={(e) =>
                            setNewTaskForm({ ...newTaskForm, description: e.target.value })
                          }
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "1rem",
                            minHeight: "100px",
                            fontFamily: "inherit",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                          Assign to
                        </label>
                        <select
                          value={newTaskForm.assignedTo || ""}
                          onChange={(e) =>
                            setNewTaskForm({
                              ...newTaskForm,
                              assignedTo: e.target.value ? parseInt(e.target.value) : null,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "1rem",
                          }}
                        >
                          <option value="">Unassigned</option>
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                          Deadline
                        </label>
                        <input
                          type="date"
                          value={newTaskForm.deadline}
                          onChange={(e) =>
                            setNewTaskForm({ ...newTaskForm, deadline: e.target.value })
                          }
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "1rem",
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600 }}>
                          Sprint
                        </label>
                        <select
                          value={newTaskForm.sprintId || ""}
                          onChange={(e) =>
                            setNewTaskForm({
                              ...newTaskForm,
                              sprintId: e.target.value ? parseInt(e.target.value) : null,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "0.75rem",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "1rem",
                          }}
                        >
                          <option value="">None</option>
                          {sprintsData.map((sprint) => (
                            <option key={sprint.id} value={sprint.id}>
                              {sprint.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "1rem" }}>
                        <button
                          onClick={() => setShowAddTaskModal(false)}
                          style={{
                            padding: "0.75rem 1.5rem",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-md)",
                            fontSize: "1rem",
                            cursor: "pointer",
                            background: "var(--bg)",
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAddTask}
                          disabled={creatingTask || !newTaskForm.title.trim()}
                          style={{
                            padding: "0.75rem 1.5rem",
                            background: "var(--primary)",
                            color: "white",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            fontSize: "1rem",
                            cursor: creatingTask || !newTaskForm.title.trim() ? "not-allowed" : "pointer",
                            opacity: creatingTask || !newTaskForm.title.trim() ? 0.6 : 1,
                          }}
                        >
                          {creatingTask ? "Creating..." : "Create Task"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Project Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Delete Project</h2>
                    <button
                      className="modal-close"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="modal-body">
                    <p>
                      Are you sure you want to delete <strong>{projectData.name}</strong>? 
                      This will delete all tasks, sprints, and associated data. This action cannot be undone.
                    </p>
                    <div className="modal-actions" style={{ marginTop: "2rem", display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        style={{
                          padding: "0.75rem 1.5rem",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          fontSize: "1rem",
                          cursor: "pointer",
                          background: "var(--bg)",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteProject}
                        disabled={deletingProject}
                        style={{
                          padding: "0.75rem 1.5rem",
                          background: "#dc2626",
                          color: "white",
                          border: "none",
                          borderRadius: "var(--radius-md)",
                          fontSize: "1rem",
                          cursor: deletingProject ? "not-allowed" : "pointer",
                          opacity: deletingProject ? 0.6 : 1,
                        }}
                      >
                        {deletingProject ? "Deleting..." : "Delete Project"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
