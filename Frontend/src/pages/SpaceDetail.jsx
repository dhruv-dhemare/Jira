import { useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Clock3,
  Circle,
  ListTodo,
  MoreVertical,
  Play,
  Plus,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
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

  // Mock data - will connect to backend later
  const projectData = {
    name: "Mechano Bot",
    type: "Scrum",
    members: 4,
  };

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

  const members = [
    { id: 1, name: "John Doe", email: "john@club.edu", initials: "JD", role: "Admin" },
    { id: 2, name: "Alice Smith", email: "alice@club.edu", initials: "AS", role: "Manager" },
    { id: 3, name: "Mike Kumar", email: "mike@club.edu", initials: "MK", role: "Member" },
    { id: 4, name: "Raj Joshi", email: "raj@club.edu", initials: "RJ", role: "Member" },
  ];

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
                <p>{projectData.type} · {projectData.members} Members</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
              <button
                className={`tab ${activeTab === "summary" ? "active" : ""}`}
                onClick={() => setActiveTab("summary")}
              >
                Summary
              </button>
              <button
                className={`tab ${activeTab === "backlog" ? "active" : ""}`}
                onClick={() => setActiveTab("backlog")}
              >
                Backlog
              </button>
              <button
                className={`tab ${activeTab === "sprints" ? "active" : ""}`}
                onClick={() => setActiveTab("sprints")}
              >
                Sprints
              </button>
              <button
                className={`tab ${activeTab === "board" ? "active" : ""}`}
                onClick={() => setActiveTab("board")}
              >
                Board
              </button>
              <button
                className={`tab ${activeTab === "calendar" ? "active" : ""}`}
                onClick={() => setActiveTab("calendar")}
              >
                Calendar
              </button>
              <button
                className={`tab ${activeTab === "members" ? "active" : ""}`}
                onClick={() => setActiveTab("members")}
              >
                Members
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="space-detail-content">
            {/* Summary Tab */}
            {activeTab === "summary" && (
              <div className="tab-content summary-content">
                {/* Task Stats */}
                <div className="stats-grid">
                  <div className="stat-card total">
                    <div className="stat-icon" aria-hidden="true">
                      <BarChart3 />
                    </div>
                    <div className="stat-label">Total Tasks</div>
                    <div className="stat-value">{taskStats.total}</div>
                  </div>
                  <div className="stat-card done">
                    <div className="stat-icon" aria-hidden="true">
                      <CheckCircle2 />
                    </div>
                    <div className="stat-label">Done</div>
                    <div className="stat-value">{taskStats.done}</div>
                  </div>
                  <div className="stat-card inprogress">
                    <div className="stat-icon" aria-hidden="true">
                      <Clock3 />
                    </div>
                    <div className="stat-label">In Progress</div>
                    <div className="stat-value">{taskStats.inProgress}</div>
                  </div>
                  <div className="stat-card todo">
                    <div className="stat-icon" aria-hidden="true">
                      <ListTodo />
                    </div>
                    <div className="stat-label">To Do</div>
                    <div className="stat-value">{taskStats.toDo}</div>
                  </div>
                </div>

                {/* Overall Progress */}
                <div className="progress-section">
                  <h3>Overall Progress</h3>
                  <div className="progress-bar">
                    <div className="progress-segment done" style={{ width: "18%" }}></div>
                    <div className="progress-segment inprogress" style={{ width: "27%" }}></div>
                    <div className="progress-segment review" style={{ width: "18%" }}></div>
                    <div className="progress-segment todo" style={{ width: "37%" }}></div>
                  </div>
                  <div className="progress-legend">
                    <div className="legend-item">
                      <span className="legend-dot done"></span>
                      <span>Done 18%</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot inprogress"></span>
                      <span>In Progress 27%</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot review"></span>
                      <span>Review 18%</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot todo"></span>
                      <span>To Do 37%</span>
                    </div>
                  </div>
                </div>

                {/* Task Assignment */}
                <div className="task-assignment-section">
                  <h3>Task Assignment</h3>
                  <div className="assignment-list">
                    {taskAssignment.map((assignment, idx) => (
                      <div key={idx} className="assignment-item">
                        <div className={`assignment-avatar ${assignment.name === "Unassigned" ? "unassigned" : ""}`}>
                          {assignment.name === "Unassigned" ? "?" : `${assignment.name.charAt(0)}${assignment.name.split(" ")[1]?.charAt(0)}`}
                        </div>
                        <div className="assignment-info">
                          <div className="assignment-name">{assignment.name}</div>
                          <div className="assignment-bar">
                            <div
                              className="assignment-fill"
                              style={{ width: `${assignment.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="assignment-stats">
                          <span>{assignment.tasks} tasks</span>
                          <span>{assignment.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Backlog Tab */}
            {activeTab === "backlog" && (
              <div className="tab-content">
                <div className="backlog-header">
                  <h3>Backlog ({backlogItems.length} items)</h3>
                </div>
                <div className="backlog-list">
                  {backlogItems.map((item) => (
                    <div key={item.id} className="backlog-item">
                      <div className="drag-handle">⋮⋮</div>
                      <div className="item-name">{item.name}</div>
                      <div className="item-label">{item.label}</div>
                      <div className="item-points">{item.points}</div>
                      <button className="more-options">
                        <MoreVertical size="1rem" />
                      </button>
                    </div>
                  ))}
                  <div className="add-item">
                    <Plus size="1rem" /> Add a backlog item...
                  </div>
                </div>
              </div>
            )}

            {/* Sprints Tab */}
            {activeTab === "sprints" && (
              <div className="tab-content">
                <div className="sprints-header">
                  <h3>Sprints</h3>
                  <button className="create-sprint-btn">
                    <Plus size="0.875rem" /> Create Sprint
                  </button>
                </div>
                <div className="sprints-list">
                  {sprints.map((sprint) => (
                    <div key={sprint.id} className="sprint-item">
                      <button
                        type="button"
                        className="sprint-header"
                        onClick={() => toggleSprintExpanded(sprint.id)}
                        aria-expanded={expandedSprintIds.has(sprint.id)}
                      >
                        <span className="sprint-toggle" aria-hidden="true">
                          {expandedSprintIds.has(sprint.id) ? (
                            <ChevronDown size="1rem" />
                          ) : (
                            <ChevronRight size="1rem" />
                          )}
                        </span>
                        <span className={`sprint-status-icon ${sprint.status.toLowerCase()}`} aria-hidden="true">
                          {sprint.status === "COMPLETED" ? (
                            <CheckCircle2 size="1.1rem" />
                          ) : sprint.status === "ACTIVE" ? (
                            <Play size="1.1rem" />
                          ) : (
                            <Circle size="1.1rem" />
                          )}
                        </span>
                        <span className="sprint-info">
                          <span className="sprint-name">{sprint.name}</span>
                        </span>
                        <span className="sprint-stats">
                          <span className="sprint-date">{sprint.date}</span>
                          <span className={`status-badge ${sprint.status.toLowerCase()}`}>
                            {sprint.status}
                          </span>
                          <span className="task-count" aria-label={`${sprint.tasks} tasks`}>
                            {sprint.tasks}
                          </span>
                        </span>
                      </button>

                      {expandedSprintIds.has(sprint.id) && (
                        <div className="sprint-body">
                          <div className="sprint-goal">Goal: {sprint.goal}</div>

                          {sprint.tasks > 0 && (
                            <div className="sprint-tasks" role="list">
                              {sprintTasksById[sprint.id].map((task) => (
                                <div key={task.id} className="sprint-task-row" role="listitem">
                                  <span className={`task-status-dot ${task.status}`} aria-hidden="true" />
                                  <span className="sprint-task-title">{task.title}</span>
                                  <span className="sprint-task-meta">
                                    <span className={`sprint-task-label label-${task.label}`}>{task.label}</span>
                                    {task.points != null && (
                                      <span className="sprint-task-points">{task.points}</span>
                                    )}
                                    <span
                                      className={`sprint-task-avatar ${!task.assignee ? "unassigned" : ""}`}
                                      aria-label={task.assignee ? `Assignee ${task.assignee}` : "Unassigned"}
                                    >
                                      {task.assignee || "?"}
                                    </span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Board Tab */}
            {activeTab === "board" && (
              <div className="tab-content board-content">
                <div className="board-grid">
                  {/* TO DO Column */}
                  <div 
                    className="board-column"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "todo")}
                  >
                    <div className="column-header">
                      <span className="column-label">
                        TO DO <span className="column-count">{boardData.todo.length}</span>
                      </span>
                      <button className="column-menu">⋯</button>
                    </div>
                    <div className="cards-container">
                      {boardData.todo.map((card) => (
                        <div 
                          key={card.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, card, "todo")}
                          onDragEnd={handleDragEnd}
                          className="card"
                        >
                          <div className="card-title">{card.title}</div>
                          <div className={`card-label label-${card.label}`}>{card.label}</div>
                          <div className="card-footer">
                            {card.points && <span className="card-points">{card.points}</span>}
                            {card.date && (
                              <span className="card-date">
                                <CalendarDays /> {card.date}
                              </span>
                            )}
                            <div className={`card-avatar ${!card.assignee ? 'unassigned' : ''}`}>
                              {card.assignee || '?'}
                            </div>
                          </div>
                        </div>
                      ))}
                      <button className="add-card-btn">+ Add task</button>
                    </div>
                  </div>

                  {/* IN PROGRESS Column */}
                  <div 
                    className="board-column"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "inprogress")}
                  >
                    <div className="column-header">
                      <span className="column-label">
                        IN PROGRESS <span className="column-count">{boardData.inprogress.length}</span>
                      </span>
                      <button className="column-menu">⋯</button>
                    </div>
                    <div className="cards-container">
                      {boardData.inprogress.map((card) => (
                        <div 
                          key={card.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, card, "inprogress")}
                          onDragEnd={handleDragEnd}
                          className="card"
                        >
                          <div className="card-title">{card.title}</div>
                          <div className={`card-label label-${card.label}`}>{card.label}</div>
                          <div className="card-footer">
                            {card.points && <span className="card-points">{card.points}</span>}
                            {card.date && (
                              <span className="card-date">
                                <CalendarDays /> {card.date}
                              </span>
                            )}
                            <div className={`card-avatar ${!card.assignee ? 'unassigned' : ''}`}>
                              {card.assignee || '?'}
                            </div>
                          </div>
                        </div>
                      ))}
                      <button className="add-card-btn">+ Add task</button>
                    </div>
                  </div>

                  {/* REVIEW Column */}
                  <div 
                    className="board-column"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "review")}
                  >
                    <div className="column-header">
                      <span className="column-label">
                        REVIEW <span className="column-count">{boardData.review.length}</span>
                      </span>
                      <button className="column-menu">⋯</button>
                    </div>
                    <div className="cards-container">
                      {boardData.review.map((card) => (
                        <div 
                          key={card.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, card, "review")}
                          onDragEnd={handleDragEnd}
                          className="card"
                        >
                          <div className="card-title">{card.title}</div>
                          <div className={`card-label label-${card.label}`}>{card.label}</div>
                          <div className="card-footer">
                            {card.points && <span className="card-points">{card.points}</span>}
                            {card.date && (
                              <span className="card-date">
                                <CalendarDays /> {card.date}
                              </span>
                            )}
                            <div className={`card-avatar ${!card.assignee ? 'unassigned' : ''}`}>
                              {card.assignee || '?'}
                            </div>
                          </div>
                        </div>
                      ))}
                      <button className="add-card-btn">+ Add task</button>
                    </div>
                  </div>

                  {/* DONE Column */}
                  <div 
                    className="board-column"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, "done")}
                  >
                    <div className="column-header">
                      <span className="column-label">
                        DONE <span className="column-count">{boardData.done.length}</span>
                      </span>
                      <button className="column-menu">⋯</button>
                    </div>
                    <div className="cards-container">
                      {boardData.done.map((card) => (
                        <div 
                          key={card.id} 
                          draggable
                          onDragStart={(e) => handleDragStart(e, card, "done")}
                          onDragEnd={handleDragEnd}
                          className="card"
                        >
                          <div className="card-title">{card.title}</div>
                          <div className={`card-label label-${card.label}`}>{card.label}</div>
                          <div className="card-footer">
                            {card.points && <span className="card-points">{card.points}</span>}
                            {card.date && (
                              <span className="card-date">
                                <CalendarDays /> {card.date}
                              </span>
                            )}
                            <div className={`card-avatar ${!card.assignee ? 'unassigned' : ''}`}>
                              {card.assignee || '?'}
                            </div>
                          </div>
                        </div>
                      ))}
                      <button className="add-card-btn">+ Add task</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === "calendar" && (
              <div className="tab-content">
                <div className="calendar-header">
                  <h3>March 2025</h3>
                  <div className="calendar-nav">
                    <button className="nav-btn">&lt;</button>
                    <button className="nav-btn">&gt;</button>
                  </div>
                </div>
                <div className="calendar-grid">
                  {/* Weekday headers */}
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                    <div key={day} className="calendar-weekday">
                      {day}
                    </div>
                  ))}
                  {/* Calendar days */}
                  {[...Array(35)].map((_, idx) => {
                    const day = idx - 1;
                    return (
                      <div
                        key={idx}
                        className={`calendar-day ${day < 0 || day >= 31 ? "other-month" : ""}`}
                      >
                        {day >= 0 && day < 31 ? day + 1 : ""}
                        {day === 14 && <div className="event-indicator">Design chassis blueprint</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Members Tab */}
            {activeTab === "members" && (
              <div className="tab-content">
                <div className="members-header">
                  <h3>Members</h3>
                  <button className="add-member-btn">
                    <Plus size="0.875rem" /> Add Member
                  </button>
                </div>
                <div className="members-list">
                  {members.map((member) => (
                    <div key={member.id} className="member-item">
                      <div className="member-avatar">{member.initials}</div>
                      <div className="member-info">
                        <div className="member-name">{member.name}</div>
                        <div className="member-email">{member.email}</div>
                      </div>
                      <div className="member-role">{member.role}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
