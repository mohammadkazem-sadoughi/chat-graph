import React, { useState, useEffect, useCallback } from 'react';
import "./App.css";
import LeftMenu from './components/LeftMenu';
import GraphView from './components/GraphView';
import ChatInterface from './components/ChatInterface';
import axios from 'axios';
import Header from './components/Header';

axios.defaults.baseURL = 'http://localhost:5001';
axios.defaults.headers.common['Content-Type'] = 'application/json';

function App() {
  const [graph, setGraph] = useState([]);
  const [activeNodeId, setActiveNodeId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const [leftMenuWidth, setLeftMenuWidth] = useState(250); // Default width
  const [graphHeight, setGraphHeight] = useState(60); // Default height percentage
  const [isLeftMenuVisible, setIsLeftMenuVisible] = useState(true);
  const [isGraphViewVisible, setIsGraphViewVisible] = useState(true);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await axios.get('/api/sessions');
      const data = response.data;
      setSessions(data);
      if (data.length > 0 && !activeSessionId) {
        setActiveSessionId(data[0].session_id);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  }, [activeSessionId]);

  const fetchNodes = useCallback(async (sessionId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/nodes/${sessionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch nodes');
      }
      const data = await response.json();
      setGraph(data);
    } catch (error) {
      console.error('Error fetching nodes:', error);
    }
  }, []);

  const updateActiveNode = useCallback(async (sessionId, nodeIndex) => {
    try {
      const response = await fetch(`http://localhost:5001/api/sessions/${sessionId}/active-node`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ node_index: nodeIndex }),
      });
      if (!response.ok) {
        throw new Error('Failed to update active node');
      }
    } catch (error) {
      console.error('Error updating active node:', error);
    }
  }, []);

  const setActiveNodeIdAndUpdate = useCallback((nodeIndex) => {
    setActiveNodeId(nodeIndex);
    if (activeSessionId) {
      updateActiveNode(activeSessionId, nodeIndex);
    }
  }, [activeSessionId, updateActiveNode]);

  const handleLeftResize = useCallback((mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    const startX = mouseDownEvent.clientX;
    const startWidth = leftMenuWidth;

    const doDrag = (mouseMoveEvent) => {
      mouseMoveEvent.preventDefault();
      const newWidth = startWidth + mouseMoveEvent.clientX - startX;
      setLeftMenuWidth(Math.max(200, Math.min(newWidth, window.innerWidth - 400)));
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftMenuWidth]);

  const handleVerticalResize = useCallback((mouseDownEvent) => {
    const startY = mouseDownEvent.clientY;
    const startHeight = graphHeight;

    const doDrag = (mouseMoveEvent) => {
      const newHeight = ((startHeight / 100) * window.innerHeight + mouseMoveEvent.clientY - startY) / window.innerHeight * 100;
      setGraphHeight(Math.max(20, Math.min(newHeight, 80)));
    };

    const stopDrag = () => {
      document.removeEventListener('mousemove', doDrag);
      document.removeEventListener('mouseup', stopDrag);
    };

    document.addEventListener('mousemove', doDrag);
    document.addEventListener('mouseup', stopDrag);
  }, [graphHeight]);

  const updateSessionName = useCallback(async (sessionId, newName) => {
    try {
      const updatedSessions = sessions.map(session => 
        session.session_id === sessionId 
          ? { ...session, session_name: newName } 
          : session
      );
      setSessions(updatedSessions);
      
      // Log the updated sessions for debugging
      console.log('Updated sessions:', updatedSessions);
      
      // Force a re-render of child components
      setActiveSessionId(prevId => {
        console.log('Forcing re-render, active session:', prevId);
        return prevId;
      });
    } catch (error) {
      console.error('Error updating session name:', error);
    }
  }, [sessions]);

  const handleNodeClick = useCallback((nodeIndex) => {
    // This function will be passed down to both GraphView and ChatInterface
    setActiveNodeIdAndUpdate(nodeIndex);
  }, [setActiveNodeIdAndUpdate]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (activeSessionId) {
      fetchNodes(activeSessionId);
      // Fetch the current session to get the active node
      fetch(`http://localhost:5001/api/sessions/${activeSessionId}`)
        .then(response => response.json())
        .then(data => {
          if (data.current_active_node_index) {
            setActiveNodeId(data.current_active_node_index);
          } else {
            setActiveNodeId(null);
          }
        })
        .catch(error => console.error('Error fetching session:', error));
    }
  }, [activeSessionId, fetchNodes]);

  const createNewSession = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5001/api/sessions', {
        method: 'POST',
      });
      if (!response.ok) {
        throw new Error('Failed to create new session');
      }
      const newSession = await response.json();
      setActiveSessionId(newSession.session_id);
      setSessions(prevSessions => [...prevSessions, newSession]);
      setGraph([]);
      setActiveNodeId(null);
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  }, []);

  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(`/api/sessions/${sessionId}`);
      // Remove the session from the local state
      setSessions(sessions.filter(session => session.session_id !== sessionId));
      // If the deleted session was active, set a new active session or null
      if (activeSessionId === sessionId) {
        const newActiveSession = sessions.find(session => session.session_id !== sessionId);
        setActiveSessionId(newActiveSession ? newActiveSession.session_id : null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const clearAllSessions = async () => {
    try {
      await axios.delete('/api/sessions');
      setSessions([]);
      setActiveSessionId(null);
      setGraph([]); // Clear the graph
      setActiveNodeId(null); // Reset active node
    } catch (error) {
      console.error('Error clearing all sessions:', error);
    }
  };

  return (
    <div className="app">
      <Header 
        onToggleLeftMenu={() => setIsLeftMenuVisible(!isLeftMenuVisible)}
        onToggleGraphView={() => setIsGraphViewVisible(!isGraphViewVisible)}
        isLeftMenuVisible={isLeftMenuVisible}
        isGraphViewVisible={isGraphViewVisible}
      />
      <div className="app-content">
        {isLeftMenuVisible && (
          <div className="left-menu-container" style={{ width: `${leftMenuWidth}px` }}>
            <LeftMenu 
              sessions={sessions}
              activeSessionId={activeSessionId}
              setActiveSessionId={setActiveSessionId}
              createNewSession={createNewSession}
              deleteSession={deleteSession}
              clearAllSessions={clearAllSessions}
            />
            <div className="vertical-resizer" onMouseDown={handleLeftResize}></div>
          </div>
        )}
        <div className="main-content">
          {isGraphViewVisible && (
            <>
              <GraphView 
                graph={graph} 
                setGraph={setGraph} 
                setActiveNodeId={setActiveNodeIdAndUpdate} 
                activeNodeId={activeNodeId}
                activeSessionId={activeSessionId}
                height={`${graphHeight}%`}
                fetchNodes={fetchNodes}
                onNodeClick={handleNodeClick}
              />
              <div className="horizontal-resizer" onMouseDown={handleVerticalResize}></div>
            </>
          )}
          <ChatInterface 
            graph={graph} 
            setGraph={setGraph} 
            activeNodeId={activeNodeId}
            setActiveNodeId={setActiveNodeIdAndUpdate}
            fetchNodes={() => fetchNodes(activeSessionId)}
            activeSessionId={activeSessionId}
            height={isGraphViewVisible ? `${100 - graphHeight}%` : '100%'}
            updateSessionName={updateSessionName}
            onNodeClick={handleNodeClick}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
