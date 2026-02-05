import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// 離線狀態 Hook
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return isOnline;
}

// 預設資料結構
const defaultData = {
  accounts: [
    { id: 'acc_1', name: '郵局', category: '銀行', active: true },
    { id: 'acc_2', name: '台新銀行', category: '銀行', active: true },
    { id: 'acc_3', name: '中國信託', category: '銀行', active: true },
  ],
  records: []
};

// 顏色配置
const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6'
];

// localStorage 操作
const loadData = () => {
  const saved = localStorage.getItem('assetTracker');
  return saved ? JSON.parse(saved) : defaultData;
};

const saveData = (data) => {
  localStorage.setItem('assetTracker', JSON.stringify(data));
};

// 生成唯一 ID
const generateId = () => `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 格式化金額（處理大數字）
const formatCurrency = (amount) => {
  // 超過 1 億，顯示為「億」
  if (amount >= 100000000) {
    return `$${(amount / 100000000).toFixed(2)}億`;
  }
  // 超過 1 萬，顯示為「萬」
  if (amount >= 100000000000) {
    return `$${(amount / 10000).toFixed(0)}萬`;
  }
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// 格式化日期
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
};

// Icons
const IconHome = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
    <polyline points="9 22 9 12 15 12 15 22"></polyline>
  </svg>
);

const IconList = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);

const IconWallet = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
    <path d="M18 12a2 2 0 0 0 0 4h4v-4z"></path>
  </svg>
);

const IconPlus = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default function App() {
  const [data, setData] = useState(loadData);
  const [currentView, setCurrentView] = useState('dashboard');
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    saveData(data);
  }, [data]);

  const calculateTotal = (assets) => {
    return Object.values(assets).reduce((sum, val) => sum + (val || 0), 0);
  };

  const chartData = data.records
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(record => ({
      date: formatDate(record.date),
      total: calculateTotal(record.assets),
      ...record.assets
    }));

  const getLatestPieData = () => {
    if (data.records.length === 0) return [];
    const latestRecord = [...data.records].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    return data.accounts
      .filter(acc => acc.active && latestRecord.assets[acc.id])
      .map(acc => ({
        name: acc.name,
        value: latestRecord.assets[acc.id] || 0,
        category: acc.category
      }))
      .filter(item => item.value > 0);
  };

  const handleAddRecord = (newRecord) => {
    setData(prev => {
      // 檢查是否已有該日期的記錄
      const existingIndex = prev.records.findIndex(r => r.date === newRecord.date);
      
      if (existingIndex !== -1) {
        // 該日期已有記錄，覆蓋它
        const updatedRecords = [...prev.records];
        updatedRecords[existingIndex] = newRecord;
        return {
          ...prev,
          records: updatedRecords
        };
      } else {
        // 該日期沒有記錄，新增
        return {
          ...prev,
          records: [...prev.records, newRecord]
        };
      }
    });
    setShowAddRecord(false);
  };

  const handleUpdateRecord = (updatedRecord, originalDate) => {
    setData(prev => {
      // 如果日期改變了，檢查新日期是否已存在
      if (updatedRecord.date !== originalDate) {
        const existingIndex = prev.records.findIndex(r => r.date === updatedRecord.date);
        if (existingIndex !== -1) {
          // 新日期已存在，刪除舊記錄，覆蓋新日期的記錄
          const filteredRecords = prev.records.filter(r => r.date !== originalDate);
          return {
            ...prev,
            records: filteredRecords.map(r => 
              r.date === updatedRecord.date ? updatedRecord : r
            )
          };
        }
      }
      // 日期沒變或新日期不存在，正常更新
      return {
        ...prev,
        records: prev.records.map(r => 
          r.date === originalDate ? updatedRecord : r
        )
      };
    });
    setEditingRecord(null);
  };

  const handleDeleteRecord = (date) => {
    setData(prev => ({
      ...prev,
      records: prev.records.filter(r => r.date !== date)
    }));
  };

  const handleAddAccount = (account) => {
    setData(prev => ({
      ...prev,
      accounts: [...prev.accounts, { ...account, id: generateId(), active: true }]
    }));
  };

  const handleToggleAccount = (id) => {
    setData(prev => ({
      ...prev,
      accounts: prev.accounts.map(acc => 
        acc.id === id ? { ...acc, active: !acc.active } : acc
      )
    }));
  };

  const handleDeleteAccount = (id) => {
    setData(prev => ({
      ...prev,
      accounts: prev.accounts.filter(acc => acc.id !== id)
    }));
  };

  return (
    <div style={styles.container}>
      {/* 離線提示 */}
      {!isOnline && (
        <div style={styles.offlineBanner}>
          📴 目前處於離線模式，資料會儲存在本地
        </div>
      )}

      {/* 主要內容區 */}
      <main style={styles.main}>
        {currentView === 'dashboard' && (
          <Dashboard 
            chartData={chartData} 
            pieData={getLatestPieData()}
            accounts={data.accounts}
            latestTotal={chartData.length > 0 ? chartData[chartData.length - 1].total : 0}
          />
        )}
        
        {currentView === 'records' && (
          <RecordList 
            records={data.records}
            accounts={data.accounts}
            calculateTotal={calculateTotal}
            onDelete={handleDeleteRecord}
            onEdit={setEditingRecord}
          />
        )}
        
        {currentView === 'accounts' && (
          <AccountManager 
            accounts={data.accounts}
            onAdd={handleAddAccount}
            onToggle={handleToggleAccount}
            onDelete={handleDeleteAccount}
            allData={data}
            onImportData={setData}
          />
        )}
      </main>

      {/* 浮動新增按鈕 */}
      <button 
        style={styles.fab}
        onClick={() => setShowAddRecord(true)}
        aria-label="新增記錄"
      >
        <IconPlus />
      </button>

      {/* 底部導航 */}
      <nav style={styles.bottomNav}>
        <button 
          style={{...styles.navItem, ...(currentView === 'dashboard' ? styles.navItemActive : {})}}
          onClick={() => setCurrentView('dashboard')}
        >
          <IconHome />
          <span style={styles.navLabel}>總覽</span>
        </button>
        <button 
          style={{...styles.navItem, ...(currentView === 'records' ? styles.navItemActive : {})}}
          onClick={() => setCurrentView('records')}
        >
          <IconList />
          <span style={styles.navLabel}>記錄</span>
        </button>
        <button 
          style={{...styles.navItem, ...(currentView === 'accounts' ? styles.navItemActive : {})}}
          onClick={() => setCurrentView('accounts')}
        >
          <IconWallet />
          <span style={styles.navLabel}>帳戶</span>
        </button>
      </nav>

      {/* 新增記錄 Modal */}
      {showAddRecord && (
        <div style={styles.modalOverlay} onClick={() => setShowAddRecord(false)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <AddRecordForm 
              accounts={data.accounts.filter(a => a.active)}
              lastRecord={data.records.length > 0 ? [...data.records].sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null}
              onSave={handleAddRecord}
              onCancel={() => setShowAddRecord(false)}
            />
          </div>
        </div>
      )}

      {/* 編輯記錄 Modal */}
      {editingRecord && (
        <div style={styles.modalOverlay} onClick={() => setEditingRecord(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <EditRecordForm 
              accounts={data.accounts}
              record={editingRecord}
              onSave={handleUpdateRecord}
              onCancel={() => setEditingRecord(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Dashboard 元件
function Dashboard({ chartData, pieData, accounts, latestTotal }) {
  const totalChange = chartData.length >= 2 
    ? chartData[chartData.length - 1].total - chartData[chartData.length - 2].total 
    : 0;
  const changePercent = chartData.length >= 2 && chartData[chartData.length - 2].total > 0
    ? ((totalChange / chartData[chartData.length - 2].total) * 100).toFixed(1)
    : 0;

  return (
    <div style={styles.dashboard}>
      {/* 總資產卡片 */}
      <div style={styles.summaryCard}>
        <div style={styles.summaryLabel}>目前總資產</div>
        <div style={styles.summaryValue}>{formatCurrency(latestTotal)}</div>
        {chartData.length >= 2 && (
          <div style={{...styles.summaryChange, color: totalChange >= 0 ? '#10b981' : '#ef4444'}}>
            {totalChange >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(totalChange))} ({changePercent}%)
          </div>
        )}
      </div>

      {/* 總資產曲線 */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>總資產變化</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} stroke="#4b5563" />
              <YAxis 
                tick={{ fontSize: 11, fill: '#9ca3af' }} 
                stroke="#4b5563"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#10b981" 
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={styles.emptyChart}>點擊右下角 + 新增第一筆記錄</div>
        )}
      </div>

      {/* 資產配置圓餅圖 */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>資產配置比例</h3>
        {pieData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  activeShape={false}
                  style={{ outline: 'none' }}
                >
                  {pieData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={styles.legendList}>
              {pieData.map((item, index) => {
                const total = pieData.reduce((sum, d) => sum + d.value, 0);
                const percent = ((item.value / total) * 100).toFixed(1);
                return (
                  <div key={item.name} style={styles.legendItem}>
                    <div style={styles.legendLeft}>
                      <div style={{...styles.legendDot, backgroundColor: COLORS[index % COLORS.length]}} />
                      <span style={styles.legendName}>{item.name}</span>
                    </div>
                    <div style={styles.legendRight}>
                      <span style={styles.legendValue}>{formatCurrency(item.value)}</span>
                      <span style={styles.legendPercent}>{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={styles.emptyChart}>尚無記錄</div>
        )}
      </div>
    </div>
  );
}

// 記錄列表元件
function RecordList({ records, accounts, calculateTotal, onDelete, onEdit }) {
  const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));
  const accountMap = Object.fromEntries(accounts.map(a => [a.id, a.name]));
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleDelete = (date) => {
    if (confirmDelete === date) {
      onDelete(date);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(date);
    }
  };

  return (
    <div style={styles.recordList}>
      <h2 style={styles.sectionTitle}>歷史記錄</h2>
      
      {sortedRecords.length === 0 ? (
        <div style={styles.emptyState}>尚無記錄，點擊右下角 + 新增</div>
      ) : (
        sortedRecords.map(record => (
          <div key={record.date} style={styles.recordCard}>
            <div style={styles.recordHeader}>
              <span style={styles.recordDate}>{formatDate(record.date)}</span>
              <span style={styles.recordTotal}>{formatCurrency(calculateTotal(record.assets))}</span>
            </div>
            <div style={styles.recordDetails}>
              {Object.entries(record.assets).map(([id, amount]) => (
                <div key={id} style={styles.recordItem}>
                  <span style={styles.recordItemName}>{accountMap[id] || id}</span>
                  <span style={styles.recordItemValue}>{formatCurrency(amount)}</span>
                </div>
              ))}
            </div>
            <div style={styles.recordActions}>
              <button 
                style={styles.editButton}
                onClick={() => onEdit(record)}
              >
                修改
              </button>
              <button 
                style={{
                  ...styles.deleteButton,
                  backgroundColor: confirmDelete === record.date ? '#dc2626' : '#374151',
                  color: confirmDelete === record.date ? '#ffffff' : '#9ca3af',
                }}
                onClick={() => handleDelete(record.date)}
              >
                {confirmDelete === record.date ? '確認刪除' : '刪除'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// 帳戶管理元件
function AccountManager({ accounts, onAdd, onToggle, onDelete, allData, onImportData }) {
  const [showForm, setShowForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', category: '銀行' });
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [importMessage, setImportMessage] = useState(null);
  const fileInputRef = React.useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newAccount.name.trim()) {
      return;
    }
    onAdd(newAccount);
    setNewAccount({ name: '', category: '銀行' });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
    }
  };

  // 匯出 JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset-tracker-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setImportMessage({ type: 'success', text: '匯出成功！' });
    setTimeout(() => setImportMessage(null), 3000);
  };

  // 匯入 JSON
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        
        // 驗證資料結構
        if (!imported.accounts || !Array.isArray(imported.accounts)) {
          throw new Error('無效的資料格式：缺少 accounts');
        }
        if (!imported.records || !Array.isArray(imported.records)) {
          throw new Error('無效的資料格式：缺少 records');
        }

        // 確認匯入
        const accountCount = imported.accounts.length;
        const recordCount = imported.records.length;
        
        if (window.confirm(`確定要匯入嗎？\n\n將匯入 ${accountCount} 個帳戶、${recordCount} 筆記錄。\n\n⚠️ 這會覆蓋目前所有資料！`)) {
          onImportData(imported);
          setImportMessage({ type: 'success', text: `匯入成功！已載入 ${accountCount} 個帳戶、${recordCount} 筆記錄` });
        }
      } catch (err) {
        setImportMessage({ type: 'error', text: `匯入失敗：${err.message}` });
      }
      
      // 清空 input 讓同一個檔案可以再次選擇
      e.target.value = '';
      setTimeout(() => setImportMessage(null), 5000);
    };
    
    reader.readAsText(file);
  };

  return (
    <div style={styles.accountManager}>
      <div style={styles.listHeader}>
        <h2 style={styles.sectionTitle}>帳戶管理</h2>
        <button 
          style={styles.headerButton} 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? '取消' : '+ 新增'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={styles.accountForm}>
          <div style={styles.formGroup}>
            <label style={styles.label}>帳戶名稱</label>
            <input
              type="text"
              value={newAccount.name}
              onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
              style={styles.input}
              placeholder="例如：玉山銀行"
              autoFocus
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>類別</label>
            <select
              value={newAccount.category}
              onChange={(e) => setNewAccount({ ...newAccount, category: e.target.value })}
              style={styles.input}
            >
              <option value="銀行">銀行</option>
              <option value="投資">投資</option>
              <option value="現金">現金</option>
              <option value="其他">其他</option>
            </select>
          </div>
          <button type="submit" style={styles.submitButton}>確認新增</button>
        </form>
      )}

      <div style={styles.accountList}>
        {accounts.map(account => (
          <div key={account.id} style={{...styles.accountCard, opacity: account.active ? 1 : 0.5}}>
            <div style={styles.accountInfo}>
              <span style={styles.accountName}>{account.name}</span>
              <span style={styles.accountCategory}>{account.category}</span>
            </div>
            <div style={styles.accountActions}>
              <button 
                style={{
                  ...styles.smallButton, 
                  backgroundColor: account.active ? '#374151' : '#065f46',
                  color: account.active ? '#9ca3af' : '#10b981',
                }}
                onClick={() => onToggle(account.id)}
              >
                {account.active ? '停用' : '啟用'}
              </button>
              <button 
                style={{
                  ...styles.smallButton, 
                  backgroundColor: confirmDelete === account.id ? '#dc2626' : '#374151',
                  color: confirmDelete === account.id ? '#ffffff' : '#9ca3af',
                }}
                onClick={() => handleDelete(account.id)}
              >
                {confirmDelete === account.id ? '確認' : '刪除'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 資料備份區塊 */}
      <div style={styles.backupSection}>
        <h3 style={styles.backupTitle}>資料備份</h3>
        
        {importMessage && (
          <div style={{
            ...styles.importMessage,
            backgroundColor: importMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: importMessage.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            color: importMessage.type === 'success' ? '#10b981' : '#ef4444',
          }}>
            {importMessage.text}
          </div>
        )}

        <div style={styles.backupInfo}>
          <span style={styles.backupInfoText}>
            目前有 {accounts.length} 個帳戶、{allData.records.length} 筆記錄
          </span>
        </div>

        <div style={styles.backupButtons}>
          <button style={styles.exportButton} onClick={handleExport}>
            ↓ 匯出備份
          </button>
          <button 
            style={styles.importButton} 
            onClick={() => fileInputRef.current?.click()}
          >
            ↑ 匯入備份
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

// 新增記錄表單
function AddRecordForm({ accounts, lastRecord, onSave, onCancel }) {
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [error, setError] = useState('');
  const [assets, setAssets] = useState(() => {
    const initial = {};
    accounts.forEach(acc => {
      initial[acc.id] = lastRecord?.assets[acc.id] || '';
    });
    return initial;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const processedAssets = {};
    Object.entries(assets).forEach(([id, value]) => {
      const num = parseInt(value) || 0;
      if (num > 0) processedAssets[id] = num;
    });
    
    if (Object.keys(processedAssets).length === 0) {
      setError('請至少填寫一個帳戶的金額');
      return;
    }

    onSave({ date, assets: processedAssets });
  };

  return (
    <div style={styles.addRecordForm}>
      <div style={styles.modalHeader}>
        <h2 style={styles.modalTitle}>新增資產記錄</h2>
        <button style={styles.closeButton} onClick={onCancel}>✕</button>
      </div>
      
      {error && (
        <div style={styles.errorMessage}>{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={styles.input}
          />
        </div>
        
        <div style={styles.assetInputs}>
          {accounts.map(account => (
            <div key={account.id} style={styles.assetInputRow}>
              <label style={styles.assetLabel}>
                {account.name}
                <span style={styles.assetCategory}>({account.category})</span>
              </label>
              <input
                type="number"
                value={assets[account.id]}
                onChange={(e) => setAssets({ ...assets, [account.id]: e.target.value })}
                style={styles.assetInput}
                placeholder="0"
                min="0"
              />
            </div>
          ))}
        </div>

        <div style={styles.formActions}>
          <button type="button" style={styles.cancelButton} onClick={onCancel}>
            取消
          </button>
          <button type="submit" style={styles.submitButton}>
            儲存記錄
          </button>
        </div>
      </form>
    </div>
  );
}

// 編輯記錄表單
function EditRecordForm({ accounts, record, onSave, onCancel }) {
  const [date, setDate] = useState(record.date);
  const [error, setError] = useState('');
  const [assets, setAssets] = useState(() => {
    const initial = {};
    accounts.forEach(acc => {
      initial[acc.id] = record.assets[acc.id] || '';
    });
    return initial;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const processedAssets = {};
    Object.entries(assets).forEach(([id, value]) => {
      const num = parseInt(value) || 0;
      if (num > 0) processedAssets[id] = num;
    });
    
    if (Object.keys(processedAssets).length === 0) {
      setError('請至少填寫一個帳戶的金額');
      return;
    }

    onSave({ date, assets: processedAssets }, record.date);
  };

  return (
    <div style={styles.addRecordForm}>
      <div style={styles.modalHeader}>
        <h2 style={styles.modalTitle}>修改資產記錄</h2>
        <button style={styles.closeButton} onClick={onCancel}>✕</button>
      </div>
      
      {error && (
        <div style={styles.errorMessage}>{error}</div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label style={styles.label}>日期</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={styles.input}
          />
        </div>
        
        <div style={styles.assetInputs}>
          {accounts.map(account => (
            <div key={account.id} style={styles.assetInputRow}>
              <label style={styles.assetLabel}>
                {account.name}
                <span style={styles.assetCategory}>({account.category})</span>
              </label>
              <input
                type="number"
                value={assets[account.id]}
                onChange={(e) => setAssets({ ...assets, [account.id]: e.target.value })}
                style={styles.assetInput}
                placeholder="0"
                min="0"
              />
            </div>
          ))}
        </div>

        <div style={styles.formActions}>
          <button type="button" style={styles.cancelButton} onClick={onCancel}>
            取消
          </button>
          <button type="submit" style={styles.submitButton}>
            儲存修改
          </button>
        </div>
      </form>
    </div>
  );
}

// 樣式定義 - 深色主題
const styles = {
  container: {
    minHeight: '100vh',
    minHeight: '100dvh',
    backgroundColor: '#111827',
    fontFamily: "'Noto Sans TC', -apple-system, BlinkMacSystemFont, sans-serif",
    paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))',
  },
  offlineBanner: {
    backgroundColor: '#292524',
    color: '#fbbf24',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: '500',
    textAlign: 'center',
    borderBottom: '1px solid #44403c',
  },
  header: {
    backgroundColor: '#1f2937',
    padding: '16px 20px',
    borderBottom: '1px solid #374151',
  },
  title: {
    color: '#10b981',
    fontSize: '22px',
    fontWeight: '700',
    margin: 0,
    letterSpacing: '1px',
  },
  main: {
    padding: '24px 16px 16px 16px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  
  // 底部導航
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1f2937',
    borderTop: '1px solid #374151',
    display: 'flex',
    justifyContent: 'space-around',
    padding: '8px 0',
    paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
    zIndex: 100,
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '8px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'color 0.2s',
  },
  navItemActive: {
    color: '#10b981',
  },
  navLabel: {
    fontSize: '12px',
    fontWeight: '500',
  },

  // 浮動按鈕
  fab: {
    position: 'fixed',
    bottom: 'calc(90px + env(safe-area-inset-bottom, 0px))',
    right: '20px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
    transition: 'transform 0.2s, box-shadow 0.2s',
  },

  // Dashboard
  dashboard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  summaryCard: {
    backgroundColor: '#1f2937',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    border: '1px solid #374151',
  },
  summaryLabel: {
    color: '#9ca3af',
    fontSize: '14px',
    marginBottom: '8px',
  },
  summaryValue: {
    color: '#10b981',
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  summaryChange: {
    fontSize: '15px',
    fontWeight: '600',
  },
  chartCard: {
    backgroundColor: '#1f2937',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #374151',
  },
  chartTitle: {
    color: '#f3f4f6',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: 0,
    marginBottom: '16px',
  },
  emptyChart: {
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    fontSize: '15px',
  },
  legendList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #374151',
  },
  legendItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#111827',
    borderRadius: '8px',
  },
  legendLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  legendDot: {
    width: '12px',
    height: '12px',
    borderRadius: '3px',
    flexShrink: 0,
  },
  legendName: {
    color: '#f3f4f6',
    fontSize: '14px',
    fontWeight: '500',
  },
  legendRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  legendValue: {
    color: '#9ca3af',
    fontSize: '13px',
  },
  legendPercent: {
    color: '#10b981',
    fontSize: '14px',
    fontWeight: '600',
    minWidth: '50px',
    textAlign: 'right',
  },

  // 記錄列表
  recordList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    color: '#f3f4f6',
    fontSize: '20px',
    fontWeight: '700',
    margin: '0 0 16px 0',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    color: '#6b7280',
    fontSize: '15px',
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    border: '1px solid #374151',
  },
  recordCard: {
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #374151',
  },
  recordHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #374151',
    gap: '12px',
  },
  recordDate: {
    color: '#9ca3af',
    fontSize: '14px',
    fontWeight: '500',
    flexShrink: 0,
  },
  recordTotal: {
    color: '#10b981',
    fontSize: '18px',
    fontWeight: '700',
    textAlign: 'right',
    wordBreak: 'break-all',
  },
  recordDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  recordItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 12px',
    backgroundColor: '#111827',
    borderRadius: '6px',
    gap: '12px',
  },
  recordItemName: {
    color: '#9ca3af',
    fontSize: '14px',
    flexShrink: 0,
  },
  recordItemValue: {
    color: '#f3f4f6',
    fontSize: '14px',
    fontWeight: '600',
    textAlign: 'right',
    wordBreak: 'break-all',
  },
  recordActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
  },
  editButton: {
    padding: '8px 16px',
    backgroundColor: '#065f46',
    color: '#10b981',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  deleteButton: {
    padding: '8px 16px',
    backgroundColor: '#374151',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  // 帳戶管理
  accountManager: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  headerButton: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  accountForm: {
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #374151',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  accountList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  accountCard: {
    backgroundColor: '#1f2937',
    borderRadius: '12px',
    padding: '14px 16px',
    border: '1px solid #374151',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'opacity 0.2s',
  },
  accountInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  accountName: {
    color: '#f3f4f6',
    fontSize: '15px',
    fontWeight: '600',
  },
  accountCategory: {
    color: '#6b7280',
    fontSize: '12px',
    padding: '2px 8px',
    backgroundColor: '#374151',
    borderRadius: '4px',
  },
  accountActions: {
    display: 'flex',
    gap: '8px',
  },
  smallButton: {
    padding: '6px 12px',
    backgroundColor: '#374151',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  backupSection: {
    marginTop: '32px',
    paddingTop: '24px',
    borderTop: '1px solid #374151',
  },
  backupTitle: {
    color: '#f3f4f6',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 16px 0',
  },
  backupInfo: {
    marginBottom: '16px',
  },
  backupInfoText: {
    color: '#6b7280',
    fontSize: '14px',
  },
  backupButtons: {
    display: 'flex',
    gap: '12px',
  },
  exportButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#065f46',
    color: '#10b981',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  importButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#374151',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  importMessage: {
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid',
  },

  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px',
  },
  modalContent: {
    backgroundColor: '#1f2937',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    border: '1px solid #374151',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 20px 0 20px',
  },
  modalTitle: {
    color: '#f3f4f6',
    fontSize: '18px',
    fontWeight: '700',
    margin: 0,
  },
  closeButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#6b7280',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
  },

  // 表單
  addRecordForm: {
    padding: '0 20px 20px 20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '16px',
  },
  label: {
    color: '#9ca3af',
    fontSize: '13px',
    fontWeight: '500',
  },
  input: {
    padding: '12px 14px',
    paddingRight: '24px',
    backgroundColor: '#111827',
    border: '1px solid #374151',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#f3f4f6',
    outline: 'none',
    minWidth: '180px',
  },
  assetInputs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '20px',
  },
  assetInputRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    backgroundColor: '#111827',
    borderRadius: '8px',
    border: '1px solid #374151',
  },
  assetLabel: {
    color: '#f3f4f6',
    fontSize: '14px',
    fontWeight: '500',
  },
  assetCategory: {
    color: '#6b7280',
    fontSize: '12px',
    marginLeft: '8px',
  },
  assetInput: {
    width: '120px',
    padding: '8px 12px',
    backgroundColor: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '6px',
    fontSize: '15px',
    color: '#10b981',
    textAlign: 'right',
    outline: 'none',
  },
  formActions: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#374151',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  submitButton: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  errorMessage: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    padding: '12px 16px',
    borderRadius: '8px',
    marginTop: '16px',
    fontSize: '14px',
    fontWeight: '500',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
};
