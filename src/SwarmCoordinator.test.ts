import { describe, it, expect, beforeEach } from 'vitest';
import { SwarmCoordinator } from './SwarmCoordinator';
import type { AgentProfile, TaskNode } from './types';

const testAgent: AgentProfile = {
  id: 'agent-1',
  name: 'Test Agent',
  role: 'worker',
  capabilities: ['analysis', 'coding'],
  maxConcurrentTasks: 3,
  knowledgePartitions: [],
};

const testTask: TaskNode = {
  id: 'task-1',
  description: 'Analyze the data',
  requiredCapabilities: ['analysis'],
  priority: 1,
  status: 'pending',
  dependencies: [],
  result: null,
  assignedTo: null,
  payload: { data: [1, 2, 3] },
};

describe('SwarmCoordinator', () => {
  let coordinator: SwarmCoordinator;

  beforeEach(() => {
    coordinator = new SwarmCoordinator({
      maxAgents: 10,
      enableHierarchy: true,
      maxHierarchyDepth: 3,
      knowledgeIsolation: 'moderate',
      taskTimeout: 5000,
      adaptiveAllocation: true,
      conflictResolution: 'weighted',
      performanceWindowSize: 50,
    });
  });

  describe('constructor', () => {
    it('creates coordinator with defaults', () => {
      const c = new SwarmCoordinator();
      const state = c.getState();
      expect(state).toBeDefined();
      expect(state.swarmId).toBeTruthy();
    });

    it('creates coordinator with custom origin ID', () => {
      const c = new SwarmCoordinator({}, 'my-origin');
      const state = c.getState();
      expect(state.swarmId).toBeTruthy();
    });
  });

  describe('agent management', () => {
    it('registers an agent', () => {
      const result = coordinator.registerAgent(testAgent);
      expect(result).toBe(true);
    });

    it('unregisters an agent', () => {
      coordinator.registerAgent(testAgent);
      const result = coordinator.unregisterAgent('agent-1');
      expect(result).toBe(true);
    });

    it('returns false for unregistering unknown agent', () => {
      const result = coordinator.unregisterAgent('nonexistent');
      expect(result).toBe(false);
    });

    it('tracks active agent count in state', () => {
      coordinator.registerAgent(testAgent);
      const state = coordinator.getState();
      expect(state.activeAgentCount).toBe(1);
    });
  });

  describe('task assignment', () => {
    it('assigns task to capable agent', () => {
      coordinator.registerAgent(testAgent);
      const assignment = coordinator.assignTask(testTask);
      expect(assignment).not.toBeNull();
      expect(assignment!.agentId).toBe('agent-1');
      expect(assignment!.task.id).toBe('task-1');
    });

    it('returns null when no capable agents', () => {
      const assignment = coordinator.assignTask(testTask);
      expect(assignment).toBeNull();
    });

    it('returns null when agent lacks required capabilities', () => {
      coordinator.registerAgent({
        ...testAgent,
        capabilities: ['cooking'], // wrong capability
      });
      const assignment = coordinator.assignTask(testTask);
      expect(assignment).toBeNull();
    });
  });

  describe('performance tracking', () => {
    it('tracks agent performance', () => {
      coordinator.registerAgent(testAgent);
      coordinator.updateAgentPerformance('agent-1', {
        agentId: 'agent-1',
        taskId: 'task-1',
        success: true,
        executionTime: 100,
        qualityScore: 0.9,
        timestamp: new Date(),
      });

      const metrics = coordinator.getPerformanceMetrics('agent-1');
      expect(metrics).toBeDefined();
    });

    it('returns all metrics when no agent specified', () => {
      coordinator.registerAgent(testAgent);
      const metrics = coordinator.getPerformanceMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('swarm state', () => {
    it('reports correct state after operations', () => {
      coordinator.registerAgent(testAgent);
      const state = coordinator.getState();
      expect(state.activeAgentCount).toBe(1);
      expect(state.status).toBeDefined();
    });

    it('tracks completed and failed tasks', () => {
      const state = coordinator.getState();
      expect(typeof state.completedTasksCount).toBe('number');
      expect(typeof state.failedTasksCount).toBe('number');
    });
  });
});
