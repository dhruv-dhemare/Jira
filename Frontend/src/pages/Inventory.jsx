import { useState, useEffect } from "react";
import { Plus, Search, Minus } from "lucide-react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";
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

  useEffect(() => {
    fetchInventory();
    fetchUser();
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
      const response = await api.patch(`/inventory/${id}/increment`);
      
      if (response.status === 200) {
        // Update local item with response data
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
      }
    } catch (err) {
      console.error("Error incrementing quantity:", err);
      alert("Failed to increment quantity");
    }
  };

  const decreaseQuantity = async (id) => {
    try {
      const response = await api.patch(`/inventory/${id}/decrement`);
      
      if (response.status === 200) {
        // Update local item with response data
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
      }
    } catch (err) {
      console.error("Error decrementing quantity:", err);
      alert("Failed to decrement quantity");
    }
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
              <button
                className="btn-add-item"
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={20} />
                Add Item
              </button>
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
                          {user?.role === "manager" ? (
                            <div className="quantity-editor">
                              <button
                                className="qty-btn qty-minus"
                                onClick={() => decreaseQuantity(item.id)}
                                title="Decrease quantity"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="qty-display">{item.available}</span>
                              <button
                                className="qty-btn qty-plus"
                                onClick={() => increaseQuantity(item.id)}
                                title="Increase quantity"
                              >
                                <Plus size={14} />
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
    </div>
  );
}
