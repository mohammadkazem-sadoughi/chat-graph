import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import './GraphView.css';

const NODE_WIDTH = 240;
const NODE_MIN_HEIGHT = 80;
const VERTICAL_SPACING = 40;
const HORIZONTAL_SPACING = 60;

function GraphView({ graph, setGraph, setActiveNodeId, activeNodeId, activeSessionId, height, fetchNodes, onNodeClick }) {
  const [selectedNodes, setSelectedNodes] = useState(new Set());
  const [contextMenuPosition, setContextMenuPosition] = useState(null);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const calculateNodeHeight = useCallback((summary) => {
    if (!summary) return NODE_MIN_HEIGHT; // Add this line to handle undefined summary
    const baseHeight = 20;
    const lineHeight = 20;
    const maxLines = 5;
    const lines = Math.min(Math.ceil(summary.length / 30), maxLines);
    return Math.max(baseHeight + lines * lineHeight, NODE_MIN_HEIGHT);
  }, []);

  const nodePositions = useMemo(() => {
    if (!graph || graph.length === 0) return {}; // Add this line to handle empty graph

    const positions = {};
    const childXOffsetMap = {};

    const isColliding = (node1, node2) => {
      if (!node1 || !node2) return false; // Add this line to handle undefined nodes
      const rect1 = {
        left: node1.x,
        right: node1.x + NODE_WIDTH,
        top: node1.y,
        bottom: node1.y + calculateNodeHeight(node1.summary)
      };
      const rect2 = {
        left: node2.x,
        right: node2.x + NODE_WIDTH,
        top: node2.y,
        bottom: node2.y + calculateNodeHeight(node2.summary)
      };
      return !(rect1.right < rect2.left || 
               rect1.left > rect2.right || 
               rect1.bottom < rect2.top || 
               rect1.top > rect2.bottom);
    };

    const calculateNodePosition = (node) => {
      if (!node) return null; // Add this line to handle undefined node
      if (positions[node.node_index]) {
        return positions[node.node_index];
      }

      let x, y;
      const parentNode = graph.find(n => n.node_index === node.parentId);

      if (parentNode) {
        const parentPos = calculateNodePosition(parentNode);
        const parentHeight = calculateNodeHeight(parentNode.summary);
        y = parentPos.y + parentHeight + VERTICAL_SPACING;

        if (!childXOffsetMap[parentNode.node_index]) {
          childXOffsetMap[parentNode.node_index] = 0;
        }

        x = parentPos.x + childXOffsetMap[parentNode.node_index] * (NODE_WIDTH + HORIZONTAL_SPACING);
        childXOffsetMap[parentNode.node_index] += 1;
      } else {
        x = 50;
        y = 50;
      }

      // Check for collisions with existing nodes
      let collision = true;
      while (collision) {
        collision = false;
        for (const existingNode of Object.values(positions)) {
          if (isColliding({ x, y, summary: node.summary }, existingNode)) {
            x += NODE_WIDTH + HORIZONTAL_SPACING;
            collision = true;
            break;
          }
        }
      }

      positions[node.node_index] = { x, y };
      return { x, y };
    };

    graph.forEach(calculateNodePosition);

    // Additional pass to resolve any remaining collisions
    let hasCollisions;
    do {
      hasCollisions = false;
      for (const node of graph) {
        const nodePos = positions[node.node_index];
        for (const otherNode of graph) {
          if (node.node_index !== otherNode.node_index) {
            const otherPos = positions[otherNode.node_index];
            if (isColliding({ ...nodePos, summary: node.summary }, { ...otherPos, summary: otherNode.summary })) {
              nodePos.x += NODE_WIDTH + HORIZONTAL_SPACING;
              hasCollisions = true;
            }
          }
        }
      }
    } while (hasCollisions);

    return positions;
  }, [graph, calculateNodeHeight]);

  const handleNodeClick = (event, nodeIndex) => {
    event.stopPropagation();
    console.log('Node clicked:', nodeIndex);
    setActiveNodeId(nodeIndex);
    onNodeClick(nodeIndex); // Call the new onNodeClick prop
  };

  const handleNodeContextMenu = (event, node) => {
    event.preventDefault();
    setContextMenuPosition({ x: event.clientX, y: event.clientY });
    if (event.metaKey || event.ctrlKey) {
      setSelectedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(node.node_index)) {
          newSet.delete(node.node_index);
        } else {
          newSet.add(node.node_index);
        }
        return newSet;
      });
    } else {
      setSelectedNodes(new Set([node.node_index]));
    }
  };

  const fetchUpdatedActiveNode = async () => {
    try {
      const response = await axios.get(`/api/sessions/${activeSessionId}/active-node`);
      const updatedActiveNodeId = response.data.active_node_id;
      setActiveNodeId(updatedActiveNodeId);
    } catch (error) {
      console.error('Error fetching updated active node:', error);
    }
  };

  const handleDeleteNodes = async () => {
    if (selectedNodes.size === 0) return;

    try {
      await axios.delete(`/api/sessions/${activeSessionId}/nodes`, {
        data: { node_indices: Array.from(selectedNodes) }
      });

      // Fetch fresh nodes and update the graph
      await fetchNodes(activeSessionId);

      // Fetch the new active node
      const response = await axios.get(`/api/sessions/${activeSessionId}/active-node`);
      const newActiveNodeId = response.data.active_node_id;
      setActiveNodeId(newActiveNodeId);

      setSelectedNodes(new Set());
      setContextMenuPosition(null);
    } catch (error) {
      console.error('Error deleting nodes:', error);
    }
  };

  const handleBackgroundClick = () => {
    setSelectedNodes(new Set());
    setContextMenuPosition(null);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2)); // Max zoom: 2x
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5)); // Min zoom: 0.5x
  };

  const handleResetZoom = () => {
    setZoom(1);
  };

  if (!activeSessionId || graph.length === 0) {
    return <div className="graph-view" style={{ height }}>No active session or graph data</div>;
  }

  return (
    <div 
      ref={containerRef}
      className="graph-view" 
      onClick={handleBackgroundClick} 
      style={{ height }}
    >
      <div className="zoom-controls">
        <button onClick={handleZoomIn} className="zoom-button" title="Zoom In">
          <i className="fas fa-plus" style={{ fontSize: '14px' }}></i>
        </button>
        <button onClick={handleResetZoom} className="zoom-button" title="Reset Zoom">
          <i className="fas fa-redo" style={{ fontSize: '14px' }}></i>
        </button>
        <button onClick={handleZoomOut} className="zoom-button" title="Zoom Out">
          <i className="fas fa-minus" style={{ fontSize: '14px' }}></i>
        </button>
      </div>
      <div className="svg-container" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
        <svg 
          ref={svgRef}
          width="100%" 
          height="100%" 
          style={{minWidth: "800px", minHeight: "600px"}}
        >
          <g>
            {graph.map((node) => {
              const { x, y } = nodePositions[node.node_index];
              const parentNode = graph.find(n => n.node_index === node.parentId);
              const isSelected = selectedNodes.has(node.node_index);
              const nodeHeight = calculateNodeHeight(node.summary);

              return (
                <g key={`${activeSessionId}_${node.node_index}`}>
                  {parentNode && (
                    <line
                      x1={x + NODE_WIDTH / 2}
                      y1={y}
                      x2={nodePositions[parentNode.node_index].x + NODE_WIDTH / 2}
                      y2={nodePositions[parentNode.node_index].y + calculateNodeHeight(parentNode.summary)}
                      className="node-link"
                    />
                  )}
                  <g
                    onClick={(event) => handleNodeClick(event, node.node_index)}
                    onContextMenu={(event) => handleNodeContextMenu(event, node)}
                  >
                    <rect
                      x={x}
                      y={y}
                      width={NODE_WIDTH}
                      height={nodeHeight}
                      className={`node ${isSelected ? 'selected' : ''} ${node.node_index === activeNodeId ? 'active' : ''}`}
                    />
                    {isSelected && (
                      <rect
                        x={x - 2}
                        y={y - 2}
                        width={NODE_WIDTH + 4}
                        height={nodeHeight + 4}
                        className="node-selection-ring"
                        rx="10"
                        ry="10"
                      />
                    )}
                    <foreignObject x={x} y={y} width={NODE_WIDTH} height={nodeHeight}>
                      <div xmlns="http://www.w3.org/1999/xhtml" className="node-content">
                        {node.summary}
                      </div>
                    </foreignObject>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      {contextMenuPosition && (
        <div className="context-menu" style={{
          position: 'absolute',
          top: contextMenuPosition.y,
          left: contextMenuPosition.x,
        }}>
          <button onClick={handleDeleteNodes} className="delete-zbutton">
            <i className="fas fa-trash"></i> Delete Selected
          </button>
        </div>
      )}
    </div>
  );
}

export default GraphView;