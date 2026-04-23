export function createDashboardService(options) {
  const {
    configLoader,
    testConnectionImpl,
    snapshotState = () => ({
      loaderServers: new Map(configLoader.servers),
      configSource: configLoader.configSource
    }),
    restoreState = (snapshot) => {
      configLoader.servers.clear();
      for (const [name, serverConfig] of snapshot.loaderServers) {
        configLoader.servers.set(name, serverConfig);
      }
      configLoader.configSource = snapshot.configSource;
    },
    beforeEdit = () => {},
    beforeDelete = () => {},
    afterDelete = () => {},
    afterSave = () => {},
    afterRestore = () => {},
    testResults = new Map()
  } = options;

  function setDashboardTestResult(serverName, status, lastDurationMs = null, error = '') {
    testResults.set(serverName.toLowerCase(), {
      status,
      lastDurationMs,
      lastCheckedAt: new Date().toISOString(),
      lastError: error || ''
    });
  }

  async function testServerConnection(serverName) {
    const normalizedName = serverName.toLowerCase();
    const startTime = Date.now();

    try {
      const result = await testConnectionImpl(normalizedName);
      const duration = result?.duration_ms ?? (Date.now() - startTime);
      setDashboardTestResult(normalizedName, 'ok', duration);
      return {
        ok: true,
        name: normalizedName,
        duration_ms: duration,
        ...(result || {})
      };
    } catch (error) {
      setDashboardTestResult(normalizedName, 'failed', null, error.message);
      throw error;
    }
  }

  async function connectAndSaveServer(serverInput) {
    const normalizedName = serverInput.name.toLowerCase();
    if (configLoader.hasServer(normalizedName)) {
      throw new Error(`Server "${normalizedName}" already exists.`);
    }

    const snapshot = snapshotState();
    try {
      configLoader.setServer(normalizedName, serverInput, 'toml');
      afterSave();
      const result = await testServerConnection(normalizedName);
      configLoader.saveToToml();
      return result;
    } catch (error) {
      restoreState(snapshot);
      afterRestore(snapshot);
      throw error;
    }
  }

  async function editAndSaveServer(oldName, serverInput) {
    const oldNormalized = oldName.toLowerCase();
    const newNormalized = serverInput.name.toLowerCase();
    const snapshot = snapshotState();

    try {
      beforeEdit(oldNormalized, newNormalized);
      configLoader.removeServer(oldNormalized);
      configLoader.setServer(newNormalized, serverInput, 'toml');
      afterSave();
      const result = await testServerConnection(newNormalized);
      configLoader.saveToToml();
      if (oldNormalized !== newNormalized) {
        testResults.delete(oldNormalized);
      }
      return result;
    } catch (error) {
      restoreState(snapshot);
      afterRestore(snapshot);
      throw error;
    }
  }

  async function deleteSavedServer(serverName) {
    const normalizedName = serverName.toLowerCase();
    if (!configLoader.hasServer(normalizedName)) {
      throw new Error(`Server "${normalizedName}" not found.`);
    }

    beforeDelete(normalizedName);
    configLoader.removeServer(normalizedName);
    afterSave();
    configLoader.saveToToml();
    testResults.delete(normalizedName);
    afterDelete(normalizedName);
    return { ok: true, name: normalizedName };
  }

  return {
    getTestResults: () => testResults,
    setDashboardTestResult,
    testServerConnection,
    connectAndSaveServer,
    editAndSaveServer,
    deleteSavedServer
  };
}
