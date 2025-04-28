import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Node, Edge } from "reactflow";
import { v4 as uuidv4 } from "uuid";
import { Workflow, NodeData, ExecutionStatus } from "./types";

interface WorkflowState {
  workflows: Record<string, Workflow>
  templates: Record<string, Workflow>
  currentWorkflowId: string | null
  executionHistory: Record<string, WorkflowExecution[]>
  workflowVersions: Record<string, Workflow[]>
  isExecuting: boolean
  
  // Getters
  getCurrentWorkflow: () => Workflow | null
  getTemplates: () => Workflow[]
  getWorkflowVersions: (workflowId: string) => Workflow[]
  
  // Actions
  setCurrentWorkflow: (id: string | null) => void
  createWorkflow: (name: string, description?: string) => string
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void
  deleteWorkflow: (id: string) => void
  duplicateWorkflow: (id: string) => string
  saveWorkflow: (workflow: Workflow) => void
  updateNodes: (id: string, nodes: Node<NodeData>[]) => void
  updateEdges: (id: string, edges: Edge[]) => void
  
  // Template management
  saveTemplate: (template: Workflow) => void
  deleteTemplate: (id: string) => void
  createWorkflowFromTemplate: (templateId: string, name?: string) => string
  
  // Version control
  createVersion: (workflowId: string) => void
  restoreVersion: (workflowId: string, versionIndex: number) => void
  
  // Execution
  setIsExecuting: (executing: boolean) => void
  addExecutionRecord: (workflowId: string, execution: WorkflowExecution) => void
  getExecutionHistory: (workflowId: string) => WorkflowExecution[]
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  startTime: string
  endTime?: string
  status: ExecutionStatus
  nodeResults: Record<string, any>
  nodeErrors: Record<string, string>
  nodeStatuses: Record<string, ExecutionStatus>
  executionTime?: number
  variables: Record<string, any>
}

// Import default templates
import { defaultTemplates } from "./templates";

const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      workflows: {},
      templates: defaultTemplates.reduce((acc, template) => {
        acc[template.id] = template;
        return acc;
      }, {} as Record<string, Workflow>),
      currentWorkflowId: null,
      executionHistory: {},
      workflowVersions: {},
      isExecuting: false,
      
      // Getters
      getCurrentWorkflow: () => {
        const { currentWorkflowId, workflows } = get();
        return currentWorkflowId && workflows[currentWorkflowId] ? workflows[currentWorkflowId] : null;
      },
      
      getTemplates: () => {
        return Object.values(get().templates);
      },
      
      getWorkflowVersions: (workflowId: string) => {
        return get().workflowVersions[workflowId] || [];
      },
      
      // Actions
      setCurrentWorkflow: (id) => {
        set({ currentWorkflowId: id });
      },
      
      createWorkflow: (name, description) => {
        const id = `workflow-${uuidv4()}`;
        const newWorkflow: Workflow = {
          id,
          name,
          description: description || "",
          version: "1.0.0",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: "user", // TODO: Get from auth context
          status: ExecutionStatus.IDLE,
          nodes: [],
          edges: [],
        };
        
        set((state) => ({
          workflows: { ...state.workflows, [id]: newWorkflow },
          currentWorkflowId: id,
        }));
        
        return id;
      },
      
      updateWorkflow: (id, updates) => {
        set((state) => {
          if (!state.workflows[id]) return state;
          
          return {
            workflows: {
              ...state.workflows,
              [id]: {
                ...state.workflows[id],
                ...updates,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },
      
      deleteWorkflow: (id) => {
        set((state) => {
          const { [id]: _, ...remainingWorkflows } = state.workflows;
          return {
            workflows: remainingWorkflows,
            currentWorkflowId:
              state.currentWorkflowId === id ? null : state.currentWorkflowId,
          };
        });
      },
      
      duplicateWorkflow: (id) => {
        const workflow = get().workflows[id];
        if (!workflow) return id;
        
        const newId = `workflow-${uuidv4()}`;
        const duplicateWorkflow: Workflow = {
          ...workflow,
          id: newId,
          name: `${workflow.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          workflows: { ...state.workflows, [newId]: duplicateWorkflow },
          currentWorkflowId: newId,
        }));
        
        return newId;
      },
      
      saveWorkflow: (workflow) => {
        set((state) => ({
          workflows: { ...state.workflows, [workflow.id]: workflow },
        }));
      },
      
      updateNodes: (id, nodes) => {
        set((state) => {
          if (!state.workflows[id]) return state;
          
          return {
            workflows: {
              ...state.workflows,
              [id]: {
                ...state.workflows[id],
                nodes,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },
      
      updateEdges: (id, edges) => {
        set((state) => {
          if (!state.workflows[id]) return state;
          
          return {
            workflows: {
              ...state.workflows,
              [id]: {
                ...state.workflows[id],
                edges,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },
      
      // Execution
      setIsExecuting: (executing) => {
        set({ isExecuting: executing });
      },
      
      addExecutionRecord: (workflowId, execution) => {
        set((state) => {
          const workflowExecutions = state.executionHistory[workflowId] || [];
          
          return {
            executionHistory: {
              ...state.executionHistory,
              [workflowId]: [...workflowExecutions, execution],
            },
          };
        });
      },
      
      getExecutionHistory: (workflowId) => {
        return get().executionHistory[workflowId] || [];
      },
      
      // Template management
      saveTemplate: (template) => {
        // Ensure template is marked as a template
        const updatedTemplate = {
          ...template,
          isTemplate: true,
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          templates: {
            ...state.templates,
            [template.id]: updatedTemplate,
          },
        }));
      },
      
      deleteTemplate: (id) => {
        set((state) => {
          const { [id]: _, ...remainingTemplates } = state.templates;
          return {
            templates: remainingTemplates,
          };
        });
      },
      
      createWorkflowFromTemplate: (templateId, name) => {
        const template = get().templates[templateId];
        if (!template) {
          throw new Error(`Template with ID ${templateId} not found`);
        }
        
        // Create a new workflow from the template
        const id = `workflow-${uuidv4()}`;
        const newWorkflow: Workflow = {
          ...template,
          id,
          name: name || `${template.name.replace(" Template", "")}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isTemplate: false,
          status: ExecutionStatus.IDLE,
        };
        
        set((state) => ({
          workflows: { ...state.workflows, [id]: newWorkflow },
          currentWorkflowId: id,
        }));
        
        return id;
      },
      
      // Version control
      createVersion: (workflowId) => {
        const workflow = get().workflows[workflowId];
        if (!workflow) return;
        
        // Create a version snapshot
        const snapshot = {
          ...workflow,
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => {
          const versions = state.workflowVersions[workflowId] || [];
          return {
            workflowVersions: {
              ...state.workflowVersions,
              [workflowId]: [...versions, snapshot],
            },
          };
        });
      },
      
      restoreVersion: (workflowId, versionIndex) => {
        const versions = get().workflowVersions[workflowId];
        if (!versions || !versions[versionIndex]) return;
        
        // Restore the workflow to the version
        const version = versions[versionIndex];
        const restoredWorkflow = {
          ...version,
          updatedAt: new Date().toISOString(),
          status: ExecutionStatus.IDLE,
        };
        
        set((state) => ({
          workflows: {
            ...state.workflows,
            [workflowId]: restoredWorkflow,
          },
        }));
        
        // Create a new version snapshot after restoration
        get().createVersion(workflowId);
      },
    }),
    {
      name: "nexus-workflow-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workflows: state.workflows,
        templates: state.templates,
        executionHistory: state.executionHistory,
        workflowVersions: state.workflowVersions,
      }),
    }
  )
);

export { useWorkflowStore };