export interface AvailableServiceOption {
  readonly id: string;
  readonly name: string;
}

export interface QueueCheckResult {
  readonly success: boolean;
  readonly days: readonly string[];
  readonly centerId?: string;
  readonly centerName?: string;
  readonly serviceId?: string;
  readonly serviceName?: string;
  readonly availableServices?: readonly AvailableServiceOption[];
  readonly error?: string;
}

export interface QueueFormData {
  readonly csrf: string;
  readonly center: string;
  readonly serviceId?: string;
}
