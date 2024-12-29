import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaPaperPlane, FaSpinner, FaUser, FaRobot, FaPencilAlt, FaCopy } from 'react-icons/fa';
import { marked } from 'marked';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import './ChatInterface.css';
import axios from 'axios';

function ChatInterface({ 
  graph, 
  setGraph, 
  activeNodeId, 
  setActiveNodeId, 
  fetchNodes, 
  activeSessionId, 
  height,
  updateSessionName,
  onNodeClick
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    Prism.highlightAll();
  }, [graph]);

  useEffect(() => {
    marked.setOptions({
      highlight: function (code, lang) {
        if (Prism.languages[lang]) {
          return Prism.highlight(code, Prism.languages[lang], lang);
        }
        return code;
      },
      breaks: true,
      gfm: true
    });
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(scrollToBottom, [graph, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [activeNodeId, scrollToBottom]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submit button clicked, sending message:', input);

    if (!input.trim() || !activeSessionId) return;
    
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: input,
        sessionId: activeSessionId,
        parentId: activeNodeId
      });
      console.log('Response received from backend:', response.data);

      const newNode = response.data;
      console.log('Received new node from server:', newNode);
      setInput('');

      // Update the activeNodeId to the new node's id
      console.log('Updating active node to', newNode.node_index);
      setActiveNodeId(newNode.node_index);

      console.log('Fetching updated graph from database...');
      await fetchNodes(); // Refresh the entire graph after adding a new node
      console.log('Graph updated from database');

      // Update session name if this is the first message
      if (graph.length === 0) {
        // Assuming the API returns the updated session name in the response
        // If not, you might need to make a separate API call to get the updated session name
        const updatedSessionName = newNode.session_name || `Session ${activeSessionId.slice(0, 8)}...`;
        console.log('Updating session name to:', updatedSessionName);
        await updateSessionName(activeSessionId, updatedSessionName);
      }

    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Move the useEffect outside of handleSubmit
  useEffect(() => {
    console.log('Active node updated: ', activeNodeId);
  }, [activeNodeId]);

  useEffect(() => {
    console.log('Active node ID changed:', activeNodeId);
  }, [activeNodeId]);

  const activeMessages = graph.filter(node => {
    // Initialize a set to keep track of valid parent node indices
    const validParentIndices = new Set();
    
    // Function to recursively collect all parent nodes of the active node
    const collectParents = (nodeIndex) => {
      const parentNode = graph.find(n => n.node_index === nodeIndex);
      if (parentNode && parentNode.parentId !== null) {
        validParentIndices.add(parentNode.parentId);
        collectParents(parentNode.parentId);
      }
    };
  
    // Start collecting from the active node
    if (activeNodeId !== null) {
      collectParents(activeNodeId);
    }
  
    // Check if the current node is in the set of valid parent indices or is the active node itself
    return node.node_index === activeNodeId || validParentIndices.has(node.node_index);
  });
  
  console.log('Filtered active messages:', activeMessages);

  const renderAIMessage = (message) => {
    const html = marked(message);
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  if (!activeSessionId || graph.length === 0) {
    return (
      <div className="chat-interface" style={{ height }}>
        <div className="chat-messages">
          <div className="message-container">
            <div className="ai-message">
              <div className="message-avatar">
                <FaRobot />
              </div>
              <div className="message-content">
                Hello! How can I help you today?
              </div>
            </div>
          </div>
        </div>
        <div className="chat-input-container">
          <div className="chat-input-wrapper">
            <form onSubmit={handleSubmit} className="chat-input">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Send a message..."
                disabled={!activeSessionId || isLoading}
              />
              <button 
                type="submit" 
                disabled={!activeSessionId || !input.trim() || isLoading}
              >
                {isLoading ? <FaSpinner className="fa-spin" /> : <FaPaperPlane />}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-interface" style={{ height }}>
      <div className="chat-messages">
        {activeMessages.map(node => (
          <React.Fragment key={`${activeSessionId}_${node.node_index}`}>
            {/* User message */}
            <div className="message-container user-message-container">
              <div className="message-content-wrapper">
                <div className="user-message">
                  {node.user}
                </div>
              </div>
            </div>
            
            {/* AI message */}
            <div className="message-container ai-message-container">
              <div className="message-content-wrapper">
                <div className="ai-message">
                  <div className="message-avatar">
                    <FaRobot />
                  </div>
                  <div className="ai-content">
                    {node.ai}
                  </div>
                </div>
              </div>
            </div>
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <form onSubmit={handleSubmit} className="chat-input">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Send a message..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>
              {isLoading ? <FaSpinner className="fa-spin" /> : <FaPaperPlane />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChatInterface;
