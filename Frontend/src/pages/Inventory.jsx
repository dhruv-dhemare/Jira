import { useState, useEffect } from "react";
import { Plus, Search, Minus } from "lucide-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
import { getSocket } from "../socket/socket";
import "../styles/inventory.css";

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    available: "",
    limit: "",
  });

  // Increment/Decrement modals
  const [showIncrementModal, setShowIncrementModal] = useState(false);
  const [showDecrementModal, setShowDecrementModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [incrementQty, setIncrementQty] = useState("");
  const [decrementQty, setDecrementQty] = useState("");
  const [decrementReason, setDecrementReason] = useState("");

  // History modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchUser();
  }, []);

  // WebSocket listeners for real-time inventory updates
  useEffect(() => {
    let socket = getSocket();
    
    // If socket not ready yet, wait for it to be ready
    if (!socket || !socket.connected) {
      console.log("⏳ Inventory: Socket not ready yet, polling for connection. Socket exists:", !!socket, "Connected:", socket?.connected);
      const checkSocket = setInterval(() => {
        socket = getSocket();
        if (socket?.connected) {
          console.log("✅ Inventory: Socket is now ready, clearing interval");
          clearInterval(checkSocket);
          setupSocketListeners(socket);
        }
      }, 100);
      
      return () => clearInterval(checkSocket);
    }

    // Socket exists and is connected, set up listeners
    console.log("✅ Inventory: Socket already connected, setting up listeners");
    const cleanup = setupSocketListeners(socket);
    return cleanup;

    function setupSocketListeners(socket) {
      console.log("🔌 Inventory: Setting up socket listeners");

      const handleInventoryItemCreated = (item) => {
        console.log("📦 EVENT RECEIVED: inventoryItemCreated", item);
        fetchInventory();
      };

      const handleInventoryItemUpdated = (item) => {
        console.log("📦 EVENT RECEIVED: inventoryItemUpdated", item);
        fetchInventory();
      };

      socket.on("inventoryItemCreated", handleInventoryItemCreated);
      socket.on("inventoryItemUpdated", handleInventoryItemUpdated);
      
      // Debug: Listen for ANY event
      socket.onAny((eventName, ...args) => {
        console.log(`🔔 DEBUG: Socket event received: "${eventName}"`, args);
      });
      
      console.log("📦 Inventory: Socket listeners registered");

      return () => {
        console.log("🧹 Inventory: Cleaning up socket listeners");
        socket.off("inventoryItemCreated", handleInventoryItemCreated);
        socket.off("inventoryItemUpdated", handleInventoryItemUpdated);
      };
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await api.get("/users/me");
      setUser(res.data);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/inventory");
      
      // Map backend response to frontend format
      const formattedItems = res.data.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        available: item.available,
        limit: item.min_limit,
        status: item.available === 0 ? "Out of Stock" : (item.available < item.min_limit ? "Low Stock" : "In Stock"),
        updated: new Date(item.updated_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
      }));
      
      setItems(formattedItems);
    } catch (err) {
      console.error("Error fetching inventory:", err);
      // Fallback to empty state if API fails
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      // Call API to create item
      const response = await api.post("/inventory", {
        name: formData.name,
        category: formData.category,
        available: parseInt(formData.available) || 0,
        min_limit: parseInt(formData.limit) || 0,
      });

      if (response.status === 201) {
        // Refresh inventory list after adding
        await fetchInventory();
        setShowAddModal(false);
        setFormData({ name: "", category: "", available: "", limit: ""});
      }
    } catch (err) {
      console.error("Error adding item:", err);
      alert("Failed to add item. Please try again.");
    }
  };

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case "In Stock":
        return "#10b981";
      case "Low Stock":
        return "#f59e0b";
      case "Out of Stock":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatus = (available, limit = 5) => {
    if (available === 0) return "Out of Stock";
    if (available < limit) return "Low Stock";
    return "In Stock";
  };

  const increaseQuantity = async (id) => {
    try {
      const response = await api.patch(`/inventory/${id}/increment`, {
        quantity: parseInt(incrementQty) || 1,
      });
      
      if (response.status === 200) {
        const updatedProduct = response.data.product;
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  available: updatedProduct.available,
                  status: getStatus(updatedProduct.available, item.limit),
                }
              : item
          )
        );
        console.log(`✅ Successfully incremented by ${response.data.message}`);
        setShowIncrementModal(false);
        setIncrementQty("");
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("❌ Error incrementing quantity:", err);
      alert(`Failed to increment: ${err.response?.data?.error || err.message}`);
    }
  };

  const decreaseQuantity = async (id) => {
    try {
      const response = await api.patch(`/inventory/${id}/decrement`, {
        quantity: parseInt(decrementQty) || 1,
        reason: decrementReason,
      });
      
      if (response.status === 200) {
        const updatedProduct = response.data.product;
        setItems((prevItems) =>
          prevItems.map((item) =>
            item.id === id
              ? {
                  ...item,
                  available: updatedProduct.available,
                  status: getStatus(updatedProduct.available, item.limit),
                }
              : item
          )
        );
        console.log(`✅ Successfully decremented: ${response.data.message}`);
        setShowDecrementModal(false);
        setDecrementQty("");
        setDecrementReason("");
        setSelectedItem(null);
      }
    } catch (err) {
      console.error("❌ Error decrementing quantity:", err);
      alert(`Failed to decrement: ${err.response?.data?.error || err.message}`);
    }
  };

  const fetchHistory = async (id) => {
    try {
      setHistoryLoading(true);
      const response = await api.get(`/inventory/${id}/history`);
      setHistoryData(response.data || []);
      console.log(`📜 Fetched history for item ${id}:`, response.data);
    } catch (err) {
      console.error("❌ Error fetching history:", err);
      alert("Failed to fetch inventory history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleOpenIncrementModal = (item) => {
    setSelectedItem(item);
    setIncrementQty("");
    setShowIncrementModal(true);
  };

  const handleOpenDecrementModal = (item) => {
    setSelectedItem(item);
    setDecrementQty("");
    setDecrementReason("");
    setShowDecrementModal(true);
  };

  const handleOpenHistoryModal = (item) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
    fetchHistory(item.id);
  };

  return (
    <div className="layout">
      <Navbar />

      <div className="main">
        <Sidebar />

        <div className="content">
          <div className="inventory-container">
            {/* Header Section */}
            <div className="inventory-header">
              <div className="header-title">
                <h1 className="title">Inventory</h1>
                <p className="subtitle">
                  Track robotics club components and parts
                </p>
              </div>
              {user && ["manager", "master"].includes(user.role) && (
                <button
                  className="btn-add-item"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus size={20} />
                  Add Item
                </button>
              )}
            </div>

            {/* Search Section */}
            <div className="search-section">
              <div className="search-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search items..."
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Table Section */}
            {loading ? (
              <div className="loading">Loading inventory...</div>
            ) : (
              <div className="table-wrapper">
                <table className="inventory-table">
                  <thead>
                    <tr>
                      <th className="col-item">ITEM</th>
                      <th className="col-category">CATEGORY</th>
                      <th className="col-available">AVAILABLE</th>
                      <th className="col-status">STATUS</th>
                      <th className="col-updated">UPDATED</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td className="col-item">{item.name}</td>
                        <td className="col-category">{item.category}</td>
                        <td className="col-available">
                          {user?.role === ["manager", "master"] ? (
                            <div className="quantity-editor">
                              <button
                                className="qty-btn qty-minus"
                                onClick={() => handleOpenDecrementModal(item)}
                                title="Decrease quantity"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="qty-display">{item.available}</span>
                              <button
                                className="qty-btn qty-plus"
                                onClick={() => handleOpenIncrementModal(item)}
                                title="Increase quantity"
                              >
                                <Plus size={14} />
                              </button>
                              <button
                                className="qty-btn qty-history"
                                onClick={() => handleOpenHistoryModal(item)}
                                title="View history"
                                style={{ marginLeft: "0.5rem", fontSize: "0.75rem" }}
                              >
                                📜
                              </button>
                            </div>
                          ) : (
                            <span>{item.available}</span>
                          )}
                        </td>
                        <td className="col-status">
                          <span
                            className="status-badge"
                            style={{
                              backgroundColor: getStatusColor(item.status),
                            }}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="col-updated">{item.updated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => setShowAddModal(false)}
          ></div>
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title">Add Item to Inventory</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddItem} className="modal-body">
              <div className="modal-section">
                <label className="form-label">Item Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter item name"
                  className="form-input"
                />
              </div>

              <div className="modal-section">
                <label className="form-label">Category *</label>
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="Enter category"
                  className="form-input"
                />
              </div>

              <div className="modal-section">
                <label className="form-label">Available Quantity *</label>
                <input
                  type="number"
                  required
                  value={formData.available}
                  onChange={(e) =>
                    setFormData({ ...formData, available: e.target.value })
                  }
                  placeholder="0"
                  className="form-input"
                />
              </div>

              <div className="modal-section">
                <label className="form-label">Stock Limit (Reminder Threshold) *</label>
                <input
                  type="number"
                  required
                  value={formData.limit}
                  onChange={(e) =>
                    setFormData({ ...formData, limit: e.target.value })
                  }
                  placeholder="5"
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Increment Modal */}
      {showIncrementModal && selectedItem && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => setShowIncrementModal(false)}
          ></div>
          <div className="modal-card" style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h2 className="modal-title">Increment Stock</h2>
              <button
                className="modal-close"
                onClick={() => setShowIncrementModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: "1.5rem" }}>
              <p style={{ marginBottom: "1rem", color: "#666" }}>
                Item: <strong>{selectedItem.name}</strong> (Current: {selectedItem.available})
              </p>

              <div className="modal-section">
                <label className="form-label">Quantity to Add</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={incrementQty}
                  onChange={(e) => setIncrementQty(e.target.value)}
                  placeholder="Enter quantity"
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowIncrementModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => increaseQuantity(selectedItem.id)}
                  className="btn-submit"
                  disabled={!incrementQty || parseInt(incrementQty) <= 0}
                >
                  Add {incrementQty || 0}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Decrement Modal */}
      {showDecrementModal && selectedItem && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => setShowDecrementModal(false)}
          ></div>
          <div className="modal-card" style={{ maxWidth: "400px" }}>
            <div className="modal-header">
              <h2 className="modal-title">Decrease Stock</h2>
              <button
                className="modal-close"
                onClick={() => setShowDecrementModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: "1.5rem" }}>
              <p style={{ marginBottom: "1rem", color: "#666" }}>
                Item: <strong>{selectedItem.name}</strong> (Current: {selectedItem.available})
              </p>

              <div className="modal-section">
                <label className="form-label">Quantity to Remove</label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={decrementQty}
                  onChange={(e) => setDecrementQty(e.target.value)}
                  placeholder="Enter quantity"
                  className="form-input"
                  autoFocus
                />
              </div>

              <div className="modal-section">
                <label className="form-label">Reason for Decrement *</label>
                <input
                  type="text"
                  value={decrementReason}
                  onChange={(e) => setDecrementReason(e.target.value)}
                  placeholder="e.g., Damaged, Lost, Expired, Customer Return"
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowDecrementModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => decreaseQuantity(selectedItem.id)}
                  className="btn-submit"
                  disabled={!decrementQty || parseInt(decrementQty) <= 0 || !decrementReason.trim()}
                  style={{ backgroundColor: "#ef4444" }}
                >
                  Remove {decrementQty || 0}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedItem && (
        <>
          <div
            className="modal-backdrop"
            onClick={() => setShowHistoryModal(false)}
          ></div>
          <div className="modal-card" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h2 className="modal-title">Inventory History - {selectedItem.name}</h2>
              <button
                className="modal-close"
                onClick={() => setShowHistoryModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: "1.5rem" }}>
              {historyLoading ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
                  Loading history...
                </div>
              ) : historyData.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
                  No history records found
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "0.9rem",
                  }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid #ddd" }}>
                        <th style={{ padding: "0.75rem", textAlign: "left" }}>User</th>
                        <th style={{ padding: "0.75rem", textAlign: "left" }}>Action</th>
                        <th style={{ padding: "0.75rem", textAlign: "center" }}>Qty</th>
                        <th style={{ padding: "0.75rem", textAlign: "left" }}>Reason</th>
                        <th style={{ padding: "0.75rem", textAlign: "left" }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((record) => (
                        <tr key={record.id} style={{ borderBottom: "1px solid #eee" }}>
                          <td style={{ padding: "0.75rem" }}>
                            <div>
                              <strong>{record.name}</strong>
                              <div style={{ fontSize: "0.8rem", color: "#999" }}>
                                {record.email}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            <span
                              style={{
                                padding: "0.25rem 0.5rem",
                                borderRadius: "4px",
                                fontSize: "0.85rem",
                                fontWeight: "600",
                                backgroundColor:
                                  record.action === "INCREMENT" ? "#d1fae5" : "#fee2e2",
                                color:
                                  record.action === "INCREMENT" ? "#065f46" : "#991b1b",
                              }}
                            >
                              {record.action}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "center" }}>
                            <strong>{record.quantity}</strong>
                          </td>
                          <td style={{ padding: "0.75rem", color: "#666" }}>
                            {record.reason || "-"}
                          </td>
                          <td style={{ padding: "0.75rem", whiteSpace: "nowrap", color: "#999" }}>
                            {new Date(record.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="form-actions" style={{ marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="btn-submit"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
