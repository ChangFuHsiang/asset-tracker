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
    const accountMap = Object.fromEntries(data.accounts.map(a => [a.id, a]));
    
    // 顯示記錄中所有有金額的帳戶，不管帳戶是否停用或刪除
    return Object.entries(latestRecord.assets)
      .filter(([id, amount]) => amount > 0)
      .map(([id, amount]) => {
        const account = accountMap[id];
        return {
          name: account ? account.name : id,
          value: amount,
          category: account ? account.category : '其他'
        };
      });
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
      accounts: [...prev.accounts, { ...account, id: generateId(), active: true, deleted: false }]
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
    // 軟刪除：標記為已刪除，但保留資料供歷史記錄使用
    setData(prev => ({
      ...prev,
      accounts: prev.accounts.map(acc => 
        acc.id === id ? { ...acc, deleted: true, active: false } : acc
      )
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
            records={data.records}
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
              accounts={data.accounts.filter(a => a.active && !a.deleted)}
              records={data.records}
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
function Dashboard({ chartData, pieData, accounts, records, latestTotal }) {
  const [timeRange, setTimeRange] = useState('all'); // 'all', '1y', '6m', '3m'
  const [assetViewMode, setAssetViewMode] = useState('pie'); // 'pie' 或 'history'
  const [assetTimeRange, setAssetTimeRange] = useState('all'); // 帳戶歷史的時間範圍
  const [selectedAccount, setSelectedAccount] = useState(null); // 選中的帳戶

  // 根據時間範圍篩選資料
  const getFilteredData = (range, data) => {
    if (range === 'all' || data.length === 0) return data;
    
    const now = new Date();
    let cutoffDate = new Date();
    
    switch (range) {
      case '3m':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6m':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return data;
    }
    
    return data.filter(item => {
      const parts = item.date.split('/');
      const itemDate = new Date(parts[0], parts[1] - 1, parts[2]);
      return itemDate >= cutoffDate;
    });
  };

  const filteredData = getFilteredData(timeRange, chartData);
  
  // 計算篩選後的變化
  const totalChange = filteredData.length >= 2 
    ? filteredData[filteredData.length - 1].total - filteredData[0].total 
    : 0;
  const changePercent = filteredData.length >= 2 && filteredData[0].total > 0
    ? ((totalChange / filteredData[0].total) * 100).toFixed(1)
    : 0;

  const timeRangeOptions = [
    { value: '3m', label: '近三月' },
    { value: '6m', label: '近六月' },
    { value: '1y', label: '近一年' },
    { value: 'all', label: '全部' },
  ];

  // 計算圖例資料（按金額排序）
  const getLegendData = () => {
    if (pieData.length === 0) return [];
    
    const total = pieData.reduce((sum, d) => sum + d.value, 0);
    
    return pieData
      .map((item, index) => {
        const percent = total > 0 ? (item.value / total) * 100 : 0;
        const account = accounts.find(a => a.name === item.name);
        return {
          name: item.name,
          value: item.value,
          percent,
          color: COLORS[index % COLORS.length],
          accountId: account?.id,
        };
      })
      .sort((a, b) => b.value - a.value); // 固定按金額降序排序
  };

  const legendData = getLegendData();

  // 處理帳戶點擊
  const handleAccountClick = (item) => {
    if (assetViewMode === 'history') {
      setSelectedAccount(item);
    }
  };

  // 取得單一帳戶歷史資料
  const getAccountHistoryData = () => {
    if (!selectedAccount) return [];
    
    const sortedRecords = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const historyData = sortedRecords.map(record => ({
      date: formatDate(record.date),
      value: record.assets[selectedAccount.accountId] || 0,
    }));
    
    return getFilteredData(assetTimeRange, historyData);
  };

  const accountHistoryData = getAccountHistoryData();

  // 是否顯示點（全部模式不顯示）
  const showDots = timeRange !== 'all';
  const showAssetDots = assetTimeRange !== 'all';

  return (
    <div style={styles.dashboard}>
      {/* 總資產卡片 */}
      <div style={styles.summaryCard}>
        <div style={styles.summaryLabel}>目前總資產</div>
        <div style={styles.summaryValue}>{formatCurrency(latestTotal)}</div>
        {filteredData.length >= 2 && (
          <div style={{...styles.summaryChange, color: totalChange >= 0 ? '#10b981' : '#ef4444'}}>
            {totalChange >= 0 ? '↑' : '↓'} {formatCurrency(Math.abs(totalChange))} ({changePercent}%)
          </div>
        )}
      </div>

      {/* 總資產曲線 */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitleCentered}>總資產變化</h3>
        
        {/* 時間範圍選擇器 */}
        <div style={styles.timeRangeSelectorCentered}>
          {timeRangeOptions.map(option => (
            <button
              key={option.value}
              style={{
                ...styles.timeRangeButton,
                ...(timeRange === option.value ? styles.timeRangeButtonActive : {}),
              }}
              onClick={() => setTimeRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={filteredData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} stroke="#4b5563" />
              <YAxis 
                tick={{ fontSize: 11, fill: '#9ca3af' }} 
                stroke="#4b5563"
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              {showDots && (
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f3f4f6',
                  }}
                  formatter={(value) => [formatCurrency(value), '總資產']}
                  labelStyle={{ color: '#9ca3af' }}
                />
              )}
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={showDots ? { fill: '#10b981', strokeWidth: 2, r: 4 } : false}
                activeDot={showDots ? { r: 6, fill: '#10b981' } : false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={styles.emptyChart}>
            {chartData.length > 0 ? '該時間範圍內無記錄' : '點擊右下角 + 新增第一筆記錄'}
          </div>
        )}
      </div>

      {/* 資產配置區塊 */}
      <div style={styles.chartCard}>
        <h3 style={styles.chartTitleCentered}>資產配置</h3>
        
        {/* 顯示模式切換 */}
        <div style={styles.viewModeSelector}>
          <button
            style={{
              ...styles.viewModeButton,
              ...(assetViewMode === 'pie' ? styles.viewModeButtonActive : {}),
            }}
            onClick={() => {
              setAssetViewMode('pie');
              setSelectedAccount(null);
            }}
          >
            配置比例
          </button>
          <button
            style={{
              ...styles.viewModeButton,
              ...(assetViewMode === 'history' ? styles.viewModeButtonActive : {}),
            }}
            onClick={() => setAssetViewMode('history')}
          >
            帳戶歷史
          </button>
        </div>

        {pieData.length > 0 ? (
          <>
            {assetViewMode === 'pie' ? (
              /* 圓餅圖模式 */
              <div style={styles.chartCentered}>
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
              </div>
            ) : (
              /* 帳戶歷史模式 */
              <>
                {selectedAccount ? (
                  <>
                    <div style={styles.selectedAccountHeader}>
                      <div style={{...styles.legendDot, backgroundColor: selectedAccount.color}} />
                      <span style={styles.selectedAccountName}>{selectedAccount.name}</span>
                    </div>
                    
                    <div style={styles.timeRangeSelectorCentered}>
                      {timeRangeOptions.map(option => (
                        <button
                          key={option.value}
                          style={{
                            ...styles.timeRangeButton,
                            ...(assetTimeRange === option.value ? styles.timeRangeButtonActive : {}),
                          }}
                          onClick={() => setAssetTimeRange(option.value)}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                    
                    {accountHistoryData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={accountHistoryData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} stroke="#4b5563" />
                          <YAxis 
                            tick={{ fontSize: 10, fill: '#9ca3af' }} 
                            stroke="#4b5563"
                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                          />
                          {showAssetDots && (
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: '#1f2937', 
                                border: '1px solid #374151',
                                borderRadius: '8px',
                                color: '#f3f4f6',
                              }}
                              formatter={(value) => [formatCurrency(value), selectedAccount.name]}
                              labelStyle={{ color: '#9ca3af' }}
                            />
                          )}
                          <Line 
                            type="monotone" 
                            dataKey="value" 
                            stroke={selectedAccount.color} 
                            strokeWidth={2}
                            dot={showAssetDots ? { fill: selectedAccount.color, strokeWidth: 2, r: 4 } : false}
                            activeDot={showAssetDots ? { r: 6, fill: selectedAccount.color } : false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={styles.emptyChart}>該時間範圍內無記錄</div>
                    )}
                  </>
                ) : (
                  <div style={styles.emptyChartHint}>
                    請點擊下方帳戶以顯示歷史紀錄
                  </div>
                )}
              </>
            )}
            
            {/* 圖例列表 */}
            <div style={styles.legendList}>
              {legendData.map((item) => (
                <div 
                  key={item.name} 
                  style={{
                    ...styles.legendItem,
                    ...(assetViewMode === 'history' ? styles.legendItemClickable : {}),
                    ...(selectedAccount?.name === item.name ? styles.legendItemSelected : {}),
                  }}
                  onClick={() => handleAccountClick(item)}
                >
                  <div style={styles.legendLeft}>
                    <div style={{...styles.legendDot, backgroundColor: item.color}} />
                    <span style={styles.legendName}>{item.name}</span>
                  </div>
                  <div style={styles.legendRight}>
                    <span style={styles.legendValue}>{formatCurrency(item.value)}</span>
                    <span style={styles.legendPercent}>{item.percent.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
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
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.date);
      setDeleteTarget(null);
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
                  backgroundColor: '#7f1d1d',
                  color: '#fca5a5',
                }}
                onClick={() => setDeleteTarget(record)}
              >
                刪除
              </button>
            </div>
          </div>
        ))
      )}

      {/* 刪除確認彈窗 */}
      {deleteTarget && (
        <div style={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>確認刪除</h3>
            <p style={styles.confirmText}>
              確定要刪除 {formatDate(deleteTarget.date)} 的記錄嗎？
            </p>
            <p style={styles.confirmSubtext}>
              總資產：{formatCurrency(calculateTotal(deleteTarget.assets))}
            </p>
            <div style={styles.confirmActions}>
              <button 
                style={styles.confirmCancelButton}
                onClick={() => setDeleteTarget(null)}
              >
                取消
              </button>
              <button 
                style={styles.confirmDeleteButton}
                onClick={handleConfirmDelete}
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 帳戶管理元件
function AccountManager({ accounts, onAdd, onToggle, onDelete, allData, onImportData }) {
  const [showForm, setShowForm] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', category: '銀行' });
  const [deleteTarget, setDeleteTarget] = useState(null); // 要刪除的帳戶
  const [importMessage, setImportMessage] = useState(null);
  const fileInputRef = React.useRef(null);

  // 過濾掉已刪除的帳戶
  const visibleAccounts = accounts.filter(a => !a.deleted);
  const activeAccounts = visibleAccounts.filter(a => a.active);
  const inactiveAccounts = visibleAccounts.filter(a => !a.active);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newAccount.name.trim()) {
      return;
    }
    onAdd(newAccount);
    setNewAccount({ name: '', category: '銀行' });
    setShowForm(false);
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id);
      setDeleteTarget(null);
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
        {activeAccounts.map(account => (
          <div key={account.id} style={styles.accountCard}>
            <div style={styles.accountInfo}>
              <span style={styles.accountName}>{account.name}</span>
              <span style={styles.accountCategory}>{account.category}</span>
            </div>
            <div style={styles.accountActions}>
              <button 
                style={{
                  ...styles.smallButton, 
                  backgroundColor: '#374151',
                  color: '#9ca3af',
                }}
                onClick={() => onToggle(account.id)}
              >
                停用
              </button>
              <button 
                style={{
                  ...styles.smallButton, 
                  backgroundColor: '#7f1d1d',
                  color: '#fca5a5',
                }}
                onClick={() => setDeleteTarget(account)}
              >
                刪除
              </button>
            </div>
          </div>
        ))}
        
        {/* 已停用的帳戶 */}
        {inactiveAccounts.length > 0 && (
          <>
            <div style={{ marginTop: '20px', marginBottom: '8px', color: '#6b7280', fontSize: '13px' }}>
              已停用的帳戶
            </div>
            {inactiveAccounts.map(account => (
              <div key={account.id} style={{...styles.accountCard, opacity: 0.6}}>
                <div style={styles.accountInfo}>
                  <span style={styles.accountName}>{account.name}</span>
                  <span style={styles.accountCategory}>{account.category}</span>
                </div>
                <div style={styles.accountActions}>
                  <button 
                    style={{
                      ...styles.smallButton, 
                      backgroundColor: '#065f46',
                      color: '#10b981',
                    }}
                    onClick={() => onToggle(account.id)}
                  >
                    啟用
                  </button>
                  <button 
                    style={{
                      ...styles.smallButton, 
                      backgroundColor: '#7f1d1d',
                      color: '#fca5a5',
                    }}
                    onClick={() => setDeleteTarget(account)}
                  >
                    刪除
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* 刪除確認彈窗 */}
      {deleteTarget && (
        <div style={styles.modalOverlay} onClick={() => setDeleteTarget(null)}>
          <div style={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.confirmTitle}>確認刪除</h3>
            <p style={styles.confirmText}>
              確定要刪除「{deleteTarget.name}」嗎？
            </p>
            <p style={styles.confirmSubtext}>
              刪除後帳戶將從列表隱藏，但歷史記錄仍會保留。
            </p>
            <div style={styles.confirmActions}>
              <button 
                style={styles.confirmCancelButton}
                onClick={() => setDeleteTarget(null)}
              >
                取消
              </button>
              <button 
                style={styles.confirmDeleteButton}
                onClick={handleConfirmDelete}
              >
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

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
            目前有 {visibleAccounts.length} 個帳戶、{allData.records.length} 筆記錄
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
function AddRecordForm({ accounts, records, lastRecord, onSave, onCancel }) {
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

  // 檢查該日期是否已有記錄
  const existingRecord = records.find(r => r.date === date);

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

        {/* 覆蓋提示 */}
        {existingRecord && (
          <div style={styles.overwriteWarning}>
            ⚠️ 該日期已有記錄，儲存後將會覆蓋原有資料
          </div>
        )}
        
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
            {existingRecord ? '覆蓋並儲存' : '儲存記錄'}
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
  
  // 計算要顯示的帳戶：活躍帳戶 + 該記錄中有金額但已刪除/停用的帳戶
  const activeAccounts = accounts.filter(a => a.active && !a.deleted);
  const recordAccountIds = Object.keys(record.assets);
  const deletedOrInactiveWithValue = accounts.filter(a => 
    (a.deleted || !a.active) && recordAccountIds.includes(a.id) && record.assets[a.id] > 0
  );
  const displayAccounts = [...activeAccounts, ...deletedOrInactiveWithValue];
  
  const [assets, setAssets] = useState(() => {
    const initial = {};
    displayAccounts.forEach(acc => {
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

  // 取得帳戶的狀態標籤
  const getAccountStatus = (account) => {
    if (account.deleted) return '已刪除';
    if (!account.active) return '已停用';
    return null;
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
          {displayAccounts.map(account => {
            const status = getAccountStatus(account);
            const isInactive = status !== null;
            return (
              <div 
                key={account.id} 
                style={{
                  ...styles.assetInputRow,
                  opacity: isInactive ? 0.6 : 1,
                }}
              >
                <label style={styles.assetLabel}>
                  {account.name}
                  {status ? (
                    <span style={{ 
                      color: '#ef4444', 
                      fontSize: '11px', 
                      marginLeft: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                    }}>
                      {status}
                    </span>
                  ) : (
                    <span style={styles.assetCategory}>({account.category})</span>
                  )}
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
            );
          })}
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
    backgroundColor: '#111827',
    fontFamily: "'Noto Sans TC', -apple-system, BlinkMacSystemFont, sans-serif",
    paddingBottom: '80px',
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
    bottom: '90px',
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
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  chartTitle: {
    color: '#f3f4f6',
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  chartTitleCentered: {
    color: '#f3f4f6',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 16px 0',
    textAlign: 'center',
  },
  timeRangeSelector: {
    display: 'flex',
    gap: '4px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  timeRangeSelectorCentered: {
    display: 'flex',
    gap: '4px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  timeRangeButton: {
    padding: '6px 12px',
    backgroundColor: '#374151',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  timeRangeButtonActive: {
    backgroundColor: '#065f46',
    color: '#10b981',
  },
  chartCentered: {
    display: 'flex',
    justifyContent: 'center',
  },
  emptyChart: {
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#6b7280',
    fontSize: '15px',
  },
  emptyChartHint: {
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    fontSize: '14px',
    textAlign: 'center',
    padding: '0 20px',
  },
  selectedAccountHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '12px',
  },
  selectedAccountName: {
    color: '#f3f4f6',
    fontSize: '15px',
    fontWeight: '600',
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
  legendItemClickable: {
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  legendItemSelected: {
    backgroundColor: '#1e3a5f',
    border: '1px solid #3b82f6',
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

  // 視圖模式切換
  viewModeSelector: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  viewModeButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#374151',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  viewModeButtonActive: {
    backgroundColor: '#065f46',
    color: '#10b981',
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
  
  // 覆蓋警告
  overwriteWarning: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    color: '#fbbf24',
    padding: '12px 16px',
    borderRadius: '8px',
    marginTop: '12px',
    fontSize: '13px',
    fontWeight: '500',
    border: '1px solid rgba(251, 191, 36, 0.3)',
  },
  
  // 確認彈窗
  confirmDialog: {
    backgroundColor: '#1f2937',
    borderRadius: '16px',
    padding: '24px',
    width: '90%',
    maxWidth: '320px',
    border: '1px solid #374151',
  },
  confirmTitle: {
    color: '#f3f4f6',
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 12px 0',
  },
  confirmText: {
    color: '#d1d5db',
    fontSize: '15px',
    margin: '0 0 8px 0',
    lineHeight: '1.5',
  },
  confirmSubtext: {
    color: '#9ca3af',
    fontSize: '13px',
    margin: '0 0 20px 0',
  },
  confirmActions: {
    display: 'flex',
    gap: '12px',
  },
  confirmCancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#374151',
    color: '#9ca3af',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  confirmDeleteButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
