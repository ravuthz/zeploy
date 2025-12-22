export interface Script {
    id: string;
    name: string;
    description: string;
    content: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface Stats {
    total_scripts: number;
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    running_executions: number;
}

export interface Execution {
    id: string;
    script_id: string;
    script_name: string;
    status: "running" | "completed" | "failed";
    output: string;
    error: string;
    started_at: string;
    completed_at?: string;
    exit_code?: number;
}