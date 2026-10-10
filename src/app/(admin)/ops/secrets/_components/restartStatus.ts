import type { InstanceStatus, ServiceStatus } from "@/type/ops";
import type { SecretItem } from "@/type/secret";

/** 아직 바뀐 값을 읽지 않은 인스턴스. 시크릿은 기동할 때 읽으므로, 마지막 변경보다 먼저 뜬 인스턴스는 옛 값을 들고 있다. */
export interface StaleInstance {
  app: string;
  instance: InstanceStatus;
  /** 이 인스턴스가 아직 반영하지 못한 시크릿. */
  secrets: SecretItem[];
}

const isRestarting = (instance: InstanceStatus) =>
  instance.phase === "RESTART_REQUESTED" || instance.phase === "RESTARTING";

/**
 * 서비스별로 재시작이 필요한 인스턴스를 고른다. 화면이 "방금 저장했다"를 기억하는 대신 서버 상태로 판단하므로
 * 새로고침하거나 다른 관리자가 바꿔도 맞게 보인다. 재시작 중인 인스턴스는 뺀다(이미 다시 뜨는 중이다).
 */
export const findStaleInstances = (
  secrets: SecretItem[],
  services: ServiceStatus[],
): StaleInstance[] =>
  services.flatMap((service) =>
    service.instances
      .filter((instance) => instance.phase === "RUNNING")
      .map((instance) => ({
        app: service.app,
        instance,
        secrets: secrets.filter(
          (secret) =>
            secret.restartApps.includes(service.app) &&
            secret.lastModifiedAt !== null &&
            new Date(secret.lastModifiedAt) > new Date(instance.startedAt),
        ),
      }))
      .filter((stale) => stale.secrets.length > 0),
  );

/** 재시작이 진행 중인 인스턴스가 있는 앱. */
export const findRestartingApps = (services: ServiceStatus[]) =>
  services
    .filter((service) => service.instances.some(isRestarting))
    .map((service) => service.app);
