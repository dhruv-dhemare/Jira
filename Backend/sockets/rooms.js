const joinProjectRoom = (socket, projectId) => {
  const room = `project_${projectId}`;
  socket.join(room);

  console.log(`📦 ${socket.id} joined ${room}`);
};

module.exports = { joinProjectRoom };