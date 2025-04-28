// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock IntersectionObserver
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
}

// Mock ResizeObserver
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    return null;
  }
  unobserve() {
    return null;
  }
  disconnect() {
    return null;
  }
}

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    
    // Simulate connection after short delay
    setTimeout(() => {
      this.readyState = 1;
      if (this.onopen) this.onopen(new Event("open"));
    }, 50);
  }
  
  send(data) {}
  close() {
    this.readyState = 3;
    if (this.onclose) this.onclose(new CloseEvent("close"));
  }
}

// Assign mocks to global
global.IntersectionObserver = MockIntersectionObserver;
global.ResizeObserver = MockResizeObserver;
global.WebSocket = MockWebSocket;

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    pathname: "/",
    query: {},
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => "/",
}));

// Mock reactflow
jest.mock("reactflow", () => {
  const ReactFlowDefaultExports = jest.requireActual("reactflow");
  
  return {
    __esModule: true,
    ...ReactFlowDefaultExports,
    useNodesState: jest.fn().mockReturnValue([[], jest.fn(), jest.fn()]),
    useEdgesState: jest.fn().mockReturnValue([[], jest.fn(), jest.fn()]),
    useReactFlow: jest.fn().mockReturnValue({
      project: jest.fn().mockImplementation(({ x, y }) => ({ x, y })),
      getNodes: jest.fn().mockReturnValue([]),
      getEdges: jest.fn().mockReturnValue([]),
      fitView: jest.fn(),
      zoomTo: jest.fn(),
      setCenter: jest.fn(),
    }),
    ReactFlowProvider: ({ children }) => children,
    BackgroundVariant: {
      DOTS: "dots",
      LINES: "lines"
    },
    EdgeType: ReactFlowDefaultExports.EdgeType || {
      DEFAULT: "default",
      STRAIGHT: "straight",
      STEP: "step",
      SMOOTHSTEP: "smoothstep",
      BEZIER: "bezier"
    },
    // Components
    ReactFlow: ({ children, nodes = [], edges = [], onInit, ...props }) => {
      if (onInit) {
        setTimeout(() => {
          onInit({
            toObject: () => ({
              nodes,
              edges,
            }),
            fitView: jest.fn(),
          });
        }, 0);
      }
      
      return (
        <div data-testid="react-flow" className="react-flow">
          {children}
          <div data-testid="react-flow-nodes">
            {nodes.map((node, i) => (
              <div key={i} className="react-flow__node" data-id={node.id}>
                {node.data?.label || node.id}
              </div>
            ))}
          </div>
        </div>
      );
    },
    Controls: () => <div data-testid="react-flow-controls">Controls</div>,
    Background: (props) => <div data-testid="react-flow-background">Background</div>,
    Panel: ({ children }) => <div data-testid="react-flow-panel">{children}</div>,
    MiniMap: () => <div data-testid="react-flow-minimap">MiniMap</div>,
  };
});