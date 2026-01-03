"use client";

import React, { createContext, useContext, ReactNode } from "react";

// Available QUAD versions
export type QUADVersion = "1.0" | "latest";

export interface VersionInfo {
  version: QUADVersion;
  displayVersion: string;
  releaseDate: string;
  isLatest: boolean;
  changelog?: string[];
}

// Version history
export const VERSIONS: VersionInfo[] = [
  {
    version: "1.0",
    displayVersion: "1.0",
    releaseDate: "December 2025",
    isLatest: true,
    changelog: [
      "Initial release of QUAD Framework",
      "4 Circles: Management, Development, QA, Infrastructure",
      "5 AI Adoption Levels: 0D-4D",
      "Platonic Solids estimation system",
      "Docs-First approach",
    ],
  },
];

// Get version info
export function getVersionInfo(version: QUADVersion): VersionInfo {
  if (version === "latest") {
    return VERSIONS.find((v) => v.isLatest) || VERSIONS[0];
  }
  return VERSIONS.find((v) => v.version === version) || VERSIONS[0];
}

// Get latest version
export function getLatestVersion(): VersionInfo {
  return VERSIONS.find((v) => v.isLatest) || VERSIONS[0];
}

interface VersionContextType {
  version: QUADVersion;
  versionInfo: VersionInfo;
  allVersions: VersionInfo[];
}

const VersionContext = createContext<VersionContextType | undefined>(undefined);

interface VersionProviderProps {
  version?: QUADVersion;
  children: ReactNode;
}

export function VersionProvider({ version = "latest", children }: VersionProviderProps) {
  const versionInfo = getVersionInfo(version);

  return (
    <VersionContext.Provider
      value={{
        version,
        versionInfo,
        allVersions: VERSIONS,
      }}
    >
      {children}
    </VersionContext.Provider>
  );
}

export function useVersion() {
  const context = useContext(VersionContext);
  if (!context) {
    // Return default values if not wrapped in provider
    const defaultVersion = getLatestVersion();
    return {
      version: "latest" as QUADVersion,
      versionInfo: defaultVersion,
      allVersions: VERSIONS,
    };
  }
  return context;
}
