export type Subtask = {
    id: string;
    title: string;
    isComplete: boolean;
    subtasks?: Subtask[];
  };
  
  export type Task = {
    id: string;
    title: string;
    description: string;
    isComplete: boolean;
    subtasks: Subtask[];
  };

  export type ModelID = {
    specimen: string;
    stage: any;
  };
  