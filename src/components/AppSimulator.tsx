import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Pencil,
  Receipt, 
  Users, 
  PieChart as ChartIcon, 
  AlertTriangle, 
  Check, 
  X,
  Wallet,
  TrendingDown, 
  TrendingUp, 
  Copy, 
  FileText, 
  Bell, 
  Sparkles, 
  Smartphone, 
  Wifi, 
  Battery, 
  CircleAlert,
  Share2,
  Calendar,
  Frown,
  Coins,
  Smile,
  ChevronRight,
  User,
  Mail,
  Lock,
  Shield,
  Phone,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, CategoryType, IASplitGroup, InvoiceItem, FriendItem } from '../types';
import {
  isFirebaseConfigured,
  logInWithGoogle,
  logInWithFacebook,
  signUpWithEmail,
  logInWithEmail,
  logOut,
  onAuthStatusChange,
  fbGetTransactions,
  fbSaveTransaction,
  fbDeleteTransaction,
  fbGetAAGroups,
  fbSaveAAGroup,
  fbDeleteAAGroup,
  fbGetInvoices,
  fbSaveInvoice,
  fbSaveUserSetting,
  fbGetUserSetting,
  fbGetPublicUserByEmail,
  fbGetNotifications,
  fbSendNotification,
  fbMarkAsReadNotification,
  fbSearchPublicUser,
  fbUpdatePublicUserProfile,
  generate10DigitUid,
  fbMigrateExistingUsersUid
} from '../firebase';

// Helper to map categories to Bootstrap Icons
const getCategoryIcon = (category: string): string => {
  switch (category) {
    case '學餐/宵夜':
      return 'bi-egg-fried';
    case '書籍教材':
      return 'bi-book-fill';
    case '學雜費':
      return 'bi-mortarboard-fill';
    case '房租水電':
      return 'bi-lightning-charge-fill';
    case '社團系隊':
      return 'bi-dribbble';
    case '社交娛樂':
      return 'bi-emoji-smile-fill';
    case '交通費':
      return 'bi-bus-front-fill';
    default:
      return 'bi-tag-fill';
  }
};

interface AppSimulatorProps {
  onBudgetUsageChange: (percentage: number) => void;
}

export default function AppSimulator({ onBudgetUsageChange }: AppSimulatorProps) {
  // --- STATE ---
  const [activeScreen, setActiveScreen] = useState<'home' | 'quick-add' | 'aa-split' | 'invoice' | 'chart' | 'account'>('home');
  
  // Financial parameters
  const [monthlyLimit, setMonthlyLimit] = useState<number>(6000); // 預設生活費
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', amount: 85, category: '學餐/宵夜', note: '大學學餐排骨飯', date: '2026-05-20T12:30:00.000Z', isInvoiceSynced: false },
    { id: '2', amount: 65, category: '加蛋手搖飲', note: '椰果珍奶微糖', date: '2026-05-20T15:40:00.000Z', isInvoiceSynced: true },
    { id: '3', amount: 480, category: '書籍教材', note: '計算機概論課本', date: '2026-05-19T09:15:00.000Z', isInvoiceSynced: false },
    { id: '4', amount: 1500, category: '房租水電', note: '分開攤水費', date: '2026-05-15T18:00:00.000Z', isInvoiceSynced: false },
    { id: '5', amount: 220, category: '社交娛樂', note: '社團期中火鍋趴', date: '2026-05-12T20:10:00.000Z', isInvoiceSynced: true }
  ]);

  // Quick Account states
  const [quickAmount, setQuickAmount] = useState<string>('');
  const [quickCategory, setQuickCategory] = useState<CategoryType>('學餐/宵夜');
  const [quickNote, setQuickNote] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Email & Facebook auth inputs
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [displayNameInput, setDisplayNameInput] = useState<string>('');
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Group Notification list and linking statuses
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifLoading, setIsNotifLoading] = useState<boolean>(false);
  const [splitFeedback, setSplitFeedback] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Invoice parameters
  const [carrierCode, setCarrierCode] = useState<string>('/UC95123');
  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    { id: 'inv-1', amount: 65, merchant: '全家便利商店', details: '椰果珍奶 *1', date: '2026-05-18', isSynced: true, prizeChecked: false, prizeResult: '未對獎' as any },
    { id: 'inv-2', amount: 120, merchant: '7-11中正門市', details: '握便當 + 優格', date: '2026-05-19', isSynced: false, prizeChecked: false, prizeResult: '未對獎' as any },
    { id: 'inv-3', amount: 350, merchant: '大國書局', details: '英語多益模擬試卷', date: '2026-05-20', isSynced: false, prizeChecked: false, prizeResult: '未對獎' as any },
    { id: 'inv-4', amount: 200, merchant: '麥當勞大學店', details: '雙層牛肉大麥克套餐', date: '2026-05-21', isSynced: false, prizeChecked: false, prizeResult: '未對獎' as any },
  ]);
  const [hasCheckedPrize, setHasCheckedPrize] = useState<boolean>(false);
  const [prizeOverlay, setPrizeOverlay] = useState<{ show: boolean; won: boolean; amount: number; message: string } | null>(null);

  // Group AA Splitting parameters
  const [aaGroups, setAaGroups] = useState<IASplitGroup[]>([
    { id: 'g1', name: '大一B班夜遊宵夜', totalAmount: 840, paidBy: '阿強', participants: ['阿強', '小明', '小美', '阿珍'], splitType: '平分', date: '2026-05-20', status: 'pending' }
  ]);
  const [aaFormTotal, setAaFormTotal] = useState<string>('1200');
  const [aaFormTitle, setAaFormTitle] = useState<string>('期末社團大火鍋');
  const [aaFormPaidBy, setAaFormPaidBy] = useState<string>('阿強');
  const [aaParticipantsText, setAaParticipantsText] = useState<string>('阿強, 小明, 小美, 阿珍');
  const [calculatedDebts, setCalculatedDebts] = useState<{ debtor: string; creditor: string; amount: number }[]>([]);
  const [activeMemeCard, setActiveMemeCard] = useState<{ show: boolean; text: string; memeType: string } | null>(null);

  // Friends list states with local storage recovery and real app users support
  const [friends, setFriends] = useState<FriendItem[]>(() => {
    const saved = localStorage.getItem('unicoin_friends');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any, idx: number) => {
            if (typeof item === 'string') {
              return { id: `local-${idx}-${Date.now()}`, displayName: item };
            }
            return item;
          });
        }
      } catch (e) {
        // failed to parse
      }
    }
    return [
      { id: 'local-1', displayName: '阿強' },
      { id: 'local-2', displayName: '小明' },
      { id: 'local-3', displayName: '小美' },
      { id: 'local-4', displayName: '阿珍' }
    ];
  });
  const [newFriendName, setNewFriendName] = useState<string>('');

  // Phone number input for account registration
  const [phoneInput, setPhoneInput] = useState<string>('');

  // Searching states for global friend searches
  const [friendSearchQuery, setFriendSearchQuery] = useState<string>('');
  const [friendSearchResult, setFriendSearchResult] = useState<any | null>(null);
  const [isSearchingFriend, setIsSearchingFriend] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>('');

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('unicoin_friends', JSON.stringify(friends));
  }, [friends]);

  // Run Firebase public users migration to conforming 10-digit UIDs
  useEffect(() => {
    fbMigrateExistingUsersUid()
      .then((res) => {
        if (res?.migrated > 0) {
          console.log(`[Firebase Migration] Converted ${res.migrated} of ${res.total} users to 10-digit UIDs.`);
        }
      })
      .catch((err) => {
        console.error("Failed to migrate existing user UIDs: ", err);
      });
  }, []);

  // Who you owe money to config options
  const [viewerName, setViewerName] = useState<string>('小明');
  const [showOnlyWhatIOwe, setShowOnlyWhatIOwe] = useState<boolean>(false);

  // Editing Transaction states
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editNote, setEditNote] = useState<string>('');
  const [editAmount, setEditAmount] = useState<string>('');
  const [editCategory, setEditCategory] = useState<CategoryType>('學餐/宵夜');

  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editProfileName, setEditProfileName] = useState<string>('');
  const [editProfilePhone, setEditProfilePhone] = useState<string>('');
  const [editProfileEmail, setEditProfileEmail] = useState<string>('');
  const [editProfileBirthday, setEditProfileBirthday] = useState<string>('');
  const [editProfileAvatar, setEditProfileAvatar] = useState<string>('');

  // Simulating / verification states
  const [phoneVerificationCodeInput, setPhoneVerificationCodeInput] = useState<string>('');
  const [sentPhoneCode, setSentPhoneCode] = useState<string>('');
  const [phoneVerified, setPhoneVerified] = useState<boolean>(false);
  const [isSendingPhoneCode, setIsSendingPhoneCode] = useState<boolean>(false);

  const [emailVerificationCodeInput, setEmailVerificationCodeInput] = useState<string>('');
  const [sentEmailCode, setSentEmailCode] = useState<string>('');
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [isSendingEmailCode, setIsSendingEmailCode] = useState<boolean>(false);

  const [profileSaveFeedback, setProfileSaveFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Firebase integration states
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  // Trigger Google Login callback on state change
  useEffect(() => {
    const unsubscribe = onAuthStatusChange((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setSyncStatus('syncing');
        // Fetch public user profile
        fbGetPublicUserByEmail(currentUser.email || '')
          .then((prof) => {
            if (prof) {
              setUserProfile(prof);
            } else {
              setUserProfile({
                uid: generate10DigitUid(currentUser.uid),
                email: currentUser.email || '',
                displayName: currentUser.displayName || '學生用戶'
              });
            }
          })
          .catch((err) => {
            console.error("Error loading profile: ", err);
            setUserProfile({
              uid: generate10DigitUid(currentUser.uid),
              email: currentUser.email || '',
              displayName: currentUser.displayName || '學生用戶'
            });
          });

        Promise.all([
          fbGetTransactions(currentUser.uid),
          fbGetAAGroups(currentUser.uid),
          fbGetInvoices(currentUser.uid),
          fbGetUserSetting(currentUser.uid)
        ]).then(([fbTx, fbGroups, fbInvs, fbSetting]) => {
          if (fbTx && fbTx.length > 0) {
            setTransactions(fbTx);
          }
          if (fbGroups && fbGroups.length > 0) {
            setAaGroups(fbGroups);
          }
          if (fbInvs && fbInvs.length > 0) {
            setInvoices(fbInvs);
          }
          if (fbSetting && typeof fbSetting.monthlyLimit === 'number') {
            setMonthlyLimit(fbSetting.monthlyLimit);
          }
          setSyncStatus('success');
        }).catch((err) => {
          console.error("Firebase sync error on login: ", err);
          setSyncStatus('error');
        });
      } else {
        setSyncStatus('idle');
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch student split notifications once logged in
  useEffect(() => {
    if (user) {
      setIsNotifLoading(true);
      fbGetNotifications(user.uid)
        .then(notifs => {
          setNotifications(notifs || []);
          setIsNotifLoading(false);
        })
        .catch(err => {
          console.error("Error loading notifications: ", err);
          setIsNotifLoading(false);
        });
    } else {
      setNotifications([]);
    }
  }, [user]);

  const handleUpdateAAStatus = (groupId: string, newStatus: 'completed' | 'canceled' | 'pending') => {
    setAaGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const nextStatus = g.status === newStatus ? 'pending' : newStatus;
        const updated = { ...g, status: nextStatus };
        if (user) {
          fbSaveAAGroup(user.uid, updated).catch(err => console.error("Firebase update AA error:", err));
        }
        return updated;
      }
      return g;
    }));
  };

  const handleToggleParticipantSettled = (groupId: string, participant: string) => {
    setAaGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const settled = g.settledParticipants || [];
        const isCurrentlySettled = settled.includes(participant);
        const nextSettled = isCurrentlySettled
          ? settled.filter(p => p !== participant)
          : [...settled, participant];
        
        // If all other participants (except paidBy) have now settled, we can auto-complete the status
        const nonPayers = g.participants.filter(p => p !== g.paidBy);
        const allSettled = nonPayers.length > 0 && nonPayers.every(p => nextSettled.includes(p));
        const nextStatus = allSettled ? 'completed' : 'pending';

        const updated: IASplitGroup = { 
          ...g, 
          settledParticipants: nextSettled,
          status: nextStatus
        };
        
        if (user) {
          fbSaveAAGroup(user.uid, updated).catch(err => console.error("Firebase update AA error:", err));
        }
        return updated;
      }
      return g;
    }));
  };

  // Calculations and monthly filters
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-05');

  // Auto-derived available months from actual entries plus current month
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add('2026-05');
    transactions.forEach(t => {
      try {
        if (t.date) {
          const m = t.date.substring(0, 7); // "YYYY-MM"
          if (m && m.length === 7 && m.match(/^\d{4}-\d{2}$/)) {
            months.add(m);
          }
        }
      } catch (e) {}
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Filter transactions to the user selected month
  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => t.date && t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  const totalExpenses = monthlyTransactions.reduce((acc, t) => acc + t.amount, 0);
  const remainingAllowance = monthlyLimit - totalExpenses;
  const expensePercentage = monthlyLimit > 0 ? (totalExpenses / monthlyLimit) * 100 : 0;

  // Dynamic category calculations memo
  const categorySummary = useMemo(() => {
    const summary: Record<CategoryType, number> = {
      '學餐/宵夜': 0,
      '書籍教材': 0,
      '學雜費': 0,
      '房租水電': 0,
      '社團系隊': 0,
      '社交娛樂': 0,
      '交通費': 0,
      '其他': 0,
    };
    let total = 0;
    monthlyTransactions.forEach(t => {
      const cat = t.category || '其他';
      if (cat in summary) {
        summary[cat as CategoryType] += t.amount;
        total += t.amount;
      } else {
        summary['其他'] += t.amount;
        total += t.amount;
      }
    });
    return { summary, total };
  }, [monthlyTransactions]);

  // Sync state upward to parent (Flutter Blueprint)
  useEffect(() => {
    onBudgetUsageChange(expensePercentage);
  }, [expensePercentage, onBudgetUsageChange]);

  // Default AA Calculator trigger
  useEffect(() => {
    runAACalculation();
  }, [aaFormTotal, aaFormPaidBy, aaParticipantsText, aaGroups]);

  const runAACalculation = () => {
    const balances: Record<string, number> = {};

    // Helper to add/sub balance
    const adjustBalance = (person: string, amount: number) => {
      balances[person] = (balances[person] || 0) + amount;
    };

    // Calculate historical pending groups
    aaGroups.forEach(g => {
      if (g.status !== 'pending') return;
      const total = g.totalAmount;
      const participants = g.participants.filter(Boolean);
      if (participants.length === 0) return;
      const share = total / participants.length;
      const settled = g.settledParticipants || [];

      participants.forEach(p => {
        if (p !== g.paidBy) {
          if (!settled.includes(p)) {
            adjustBalance(g.paidBy, share);
            adjustBalance(p, -share);
          }
        }
      });
    });

    // Calculate active draft form as well
    const draftTotal = parseFloat(aaFormTotal) || 0;
    const draftParticipants = aaParticipantsText.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (draftTotal > 0 && draftParticipants.length >= 2 && draftParticipants.includes(aaFormPaidBy)) {
      const draftShare = draftTotal / draftParticipants.length;
      draftParticipants.forEach(p => {
        if (p !== aaFormPaidBy) {
          adjustBalance(aaFormPaidBy, draftShare);
          adjustBalance(p, -draftShare);
        }
      });
    }

    // Now, run the greedy matching solver on the compiled net balances!
    const creditors: { name: string; balance: number }[] = [];
    const debtors: { name: string; balance: number }[] = [];

    Object.entries(balances).forEach(([name, bal]) => {
      if (bal > 0.1) {
        creditors.push({ name, balance: bal });
      } else if (bal < -0.1) {
        debtors.push({ name, balance: -bal }); // Keep debt positive for easy mapping
      }
    });

    // Sort to minimize transactions
    creditors.sort((a, b) => b.balance - a.balance);
    debtors.sort((a, b) => b.balance - a.balance);

    const debts: { debtor: string; creditor: string; amount: number }[] = [];
    let cIdx = 0;
    let dIdx = 0;

    while (cIdx < creditors.length && dIdx < debtors.length) {
      const creditor = creditors[cIdx];
      const debtor = debtors[dIdx];

      const settleAmount = Math.min(creditor.balance, debtor.balance);
      if (settleAmount > 0.1) {
        debts.push({
          debtor: debtor.name,
          creditor: creditor.name,
          amount: Math.round(settleAmount * 10) / 10
        });
      }

      creditor.balance -= settleAmount;
      debtor.balance -= settleAmount;

      if (creditor.balance <= 0.1) cIdx++;
      if (debtor.balance <= 0.1) dIdx++;
    }

    setCalculatedDebts(debts);
  };

  const handleResetAAForm = () => {
    setAaFormTitle('');
    setAaFormTotal('');
    setAaFormPaidBy(user?.displayName || friends[0]?.displayName || '小明');
    setAaParticipantsText(friends.map(f => f.displayName).join(', '));
    setSplitFeedback({
      text: '🧹 已重設分帳表單，可以填寫下一筆囉！',
      type: 'info'
    });
    setTimeout(() => setSplitFeedback(null), 3000);
  };

  const handleSearchFriend = async () => {
    if (!friendSearchQuery.trim()) return;
    setIsSearchingFriend(true);
    setSearchError('');
    setFriendSearchResult(null);
    try {
      const res = await fbSearchPublicUser(friendSearchQuery.trim());
      if (res) {
        const isSelf = user && (
          res.uid === (userProfile?.uid || generate10DigitUid(user.uid)) || 
          res.email === user.email
        );
        if (isSelf) {
          setSearchError('不能將自己加為好友喔！');
        } else {
          setFriendSearchResult(res);
        }
      } else {
        setSearchError('找不到該手機號碼、UID 或信箱，請確認是否輸入正確或對方是否已註冊！');
      }
    } catch (err: any) {
      setSearchError('搜尋時發生未知錯誤：' + (err.message || '請再試一次'));
    } finally {
      setIsSearchingFriend(false);
    }
  };

  const handleStartEditProfile = () => {
    if (!user) return;
    setEditProfileName(userProfile?.displayName || user.displayName || '');
    setEditProfilePhone(userProfile?.phoneNumber || '');
    setEditProfileEmail(userProfile?.email || user.email || '');
    setEditProfileBirthday(userProfile?.birthday || '');
    setEditProfileAvatar(userProfile?.avatarUrl || '🦊');
    
    setPhoneVerified(true);
    setEmailVerified(true);
    setSentPhoneCode('');
    setPhoneVerificationCodeInput('');
    setSentEmailCode('');
    setEmailVerificationCodeInput('');
    setProfileSaveFeedback(null);
    setIsEditingProfile(true);
  };

  const handleSendPhoneSMS = () => {
    if (!editProfilePhone.trim()) {
      alert('請先填寫手機號碼喔！');
      return;
    }
    setIsSendingPhoneCode(true);
    setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setSentPhoneCode(code);
      setIsSendingPhoneCode(false);
      alert(`【UniCoin 簡訊證書】您的一般變更認證碼為: ${code} (三分鐘內有效)`);
    }, 1000);
  };

  const handleVerifyPhoneSMS = () => {
    if (!phoneVerificationCodeInput.trim()) {
      alert('請輸入驗證碼！');
      return;
    }
    if (phoneVerificationCodeInput.trim() === sentPhoneCode) {
      setPhoneVerified(true);
      alert('✅ 手機號碼驗證成功！');
    } else {
      alert('❌ 驗證碼錯誤，請重新確認！');
    }
  };

  const handleSendEmailCode = () => {
    if (!editProfileEmail.trim()) {
      alert('請先填寫電子信箱喔！');
      return;
    }
    setIsSendingEmailCode(true);
    setTimeout(() => {
      const code = Math.floor(1000 + Math.random() * 9000).toString();
      setSentEmailCode(code);
      setIsSendingEmailCode(false);
      alert(`【UniCoin 信件變更通知】您的信箱認證碼為: ${code} (十分鐘內有效)`);
    }, 1000);
  };

  const handleVerifyEmailCode = () => {
    if (!emailVerificationCodeInput.trim()) {
      alert('請輸入認證碼！');
      return;
    }
    if (emailVerificationCodeInput.trim() === sentEmailCode) {
      setEmailVerified(true);
      alert('✅ 電子信箱驗證成功！');
    } else {
      alert('❌ 認證碼不符，請檢查！');
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (!editProfileName.trim()) {
      setProfileSaveFeedback({ text: '❌ 個人名字不能為空！', type: 'error' });
      return;
    }
    
    // Is phone verified?
    const isPhoneChanged = editProfilePhone !== (userProfile?.phoneNumber || '');
    if (isPhoneChanged && !phoneVerified) {
      setProfileSaveFeedback({ text: '❌ 您修改了手機號碼，請完成簡訊認證驗證流程！', type: 'error' });
      return;
    }

    // Is email verified?
    const isEmailChanged = editProfileEmail !== (userProfile?.email || user.email || '');
    const isGoogle = user?.providerData?.some((p: any) => p.providerId === 'google.com') || false;
    if (!isGoogle && isEmailChanged && !emailVerified) {
      setProfileSaveFeedback({ text: '❌ 您修改了電子信箱，請完成信箱認證碼驗證！', type: 'error' });
      return;
    }

    setIsSavingProfile(true);
    setProfileSaveFeedback({ text: '⏳ 正在寫入雲端配置與更新帳戶...', type: 'info' });

    try {
      await fbUpdatePublicUserProfile(
        userProfile?.email || user.email || '',
        editProfileEmail.trim(),
        {
          displayName: editProfileName.trim(),
          phoneNumber: editProfilePhone.trim(),
          birthday: editProfileBirthday,
          avatarUrl: editProfileAvatar
        }
      );

      // Refresh local user profile state
      const updatedProfile = await fbGetPublicUserByEmail(editProfileEmail.trim());
      setUserProfile(updatedProfile || {
        uid: generate10DigitUid(user.uid),
        email: editProfileEmail.trim(),
        displayName: editProfileName.trim(),
        phoneNumber: editProfilePhone.trim(),
        birthday: editProfileBirthday,
        avatarUrl: editProfileAvatar
      });

      // Update current authenticated user locally
      setUser((prev: any) => {
        if (!prev) return null;
        return {
          ...prev,
          displayName: editProfileName.trim(),
          email: editProfileEmail.trim()
        };
      });

      setProfileSaveFeedback({ text: '🎉 個人資料更新成功，雲端資料同步完畢！', type: 'success' });
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileSaveFeedback(null);
      }, 2000);
    } catch (err: any) {
      setProfileSaveFeedback({ text: `❌ 儲存時發生錯誤: ${err.message || '請重試'}`, type: 'error' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteAAGroup = (groupId: string, groupName: string) => {
    setAaGroups(prev => prev.filter(g => g.id !== groupId));
    if (user) {
      fbDeleteAAGroup(user.uid, groupId).catch(err => console.error("Firebase delete AA error:", err));
    }
    setSplitFeedback({
      text: `🗑️ 已刪除「${groupName}」歷史分帳紀錄`,
      type: 'info'
    });
    setTimeout(() => setSplitFeedback(null), 4000);
  };

  // Category default amounts for one-click quick addition fallback
  const getCategoryDefaultAmount = (cat: CategoryType): number => {
    switch (cat) {
      case '學餐/宵夜': return 85;
      case '書籍教材': return 480;
      case '學雜費': return 1200;
      case '房租水電': return 1500;
      case '社團系隊': return 250;
      case '社交娛樂': return 300;
      case '交通費': return 35;
      default: return 100;
    }
  };

  // One-Click Quick Addition
  const handleOneClickAdd = (cat: CategoryType) => {
    const entered = parseFloat(quickAmount);
    const finalAmount = !isNaN(entered) && entered > 0 ? entered : getCategoryDefaultAmount(cat);

    const newTx: Transaction = {
      id: Date.now().toString(),
      amount: finalAmount,
      category: cat,
      note: quickNote || `${cat}一鍵記帳`,
      date: new Date(transactionDate).toISOString(),
      isInvoiceSynced: false
    };

    setTransactions(prev => [newTx, ...prev]);
    if (user) {
      fbSaveTransaction(user.uid, newTx).catch(err => console.error("Firebase save tx error:", err));
    }

    setQuickAmount('');
    setQuickNote('');
    setActiveScreen('home');
  };

  // Quick Add handler
  const handleQuickAdd = () => {
    const entered = parseFloat(quickAmount);
    const finalAmount = !isNaN(entered) && entered > 0 ? entered : getCategoryDefaultAmount(quickCategory);

    const newTx: Transaction = {
      id: Date.now().toString(),
      amount: finalAmount,
      category: quickCategory,
      note: quickNote || `${quickCategory}記帳`,
      date: new Date(transactionDate).toISOString(),
      isInvoiceSynced: false
    };

    setTransactions([newTx, ...transactions]);
    if (user) {
      fbSaveTransaction(user.uid, newTx).catch(err => console.error("Firebase save tx error:", err));
    }
    setQuickAmount('');
    setQuickNote('');
    setActiveScreen('home');
  };

  // Keyboard clicks helper
  const handleKeypadPress = (val: string) => {
    if (val === 'C') {
      setQuickAmount('');
    } else if (val === '←') {
      setQuickAmount(prev => prev.slice(0, -1));
    } else {
      if (quickAmount.length >= 7) return; // limit size
      setQuickAmount(prev => prev + val);
    }
  };

  // AA splitter insert group
  const handleCreateAAGroup = async () => {
    const total = parseFloat(aaFormTotal) || 0;
    if (total <= 0) return;

    const partsArray = aaParticipantsText.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const newG: IASplitGroup = {
      id: Date.now().toString(),
      name: aaFormTitle || '小額代墊款',
      totalAmount: total,
      paidBy: aaFormPaidBy,
      participants: partsArray,
      splitType: '平分',
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };

    setAaGroups([newG, ...aaGroups]);
    if (user) {
      fbSaveAAGroup(user.uid, newG).catch(err => console.error("Firebase save group error:", err));
    }

    // Connect and send Notification to users with the parsed email address
    let sentCount = 0;
    const shareAmt = Math.round((total / partsArray.length) * 10) / 10;
    
    // Find if any participant names are emails or if we can send notification
    for (const part of partsArray) {
      if (part.includes('@')) {
        try {
          const peerProfile = await fbGetPublicUserByEmail(part);
          if (peerProfile && peerProfile.uid) {
            const notifId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 7);
            const notifObj = {
              id: notifId,
              title: '🔔 收到新分帳代墊通知',
              message: `同學「${user?.displayName || user?.email || 'UniCoin用戶'}」發起了「${newG.name}」分帳。您需要歸還 $${shareAmt} 元！`,
              senderName: user?.displayName || user?.email || '一位同學',
              amount: shareAmt,
              groupId: newG.id,
              date: new Date().toISOString(),
              status: 'unread'
            };
            await fbSendNotification(peerProfile.uid, notifObj);
            sentCount++;
          }
        } catch (err) {
          console.error("Failed to send split notification to", part, err);
        }
      }
    }

    if (sentCount > 0) {
      setSplitFeedback({
        text: `🎉 成功創立分帳並且已送出 ${sentCount} 筆 UniCoin 雲端催款通知給配對信箱的同學！`,
        type: 'success'
      });
      setTimeout(() => setSplitFeedback(null), 8000);
    } else {
      setSplitFeedback({
        text: `📥 成功創立分帳「${newG.name}」！補給提示：若填寫信箱（如 test@g.app）且對方已註冊，系統會直接寄送雲端催款喔！`,
        type: 'success'
      });
      setTimeout(() => setSplitFeedback(null), 8500);
    }

    setAaFormTitle('');
    setAaFormTotal('');
  };

  // Generate LINE hilarious template card
  const handleGenerateMemeCard = (debtor: string, creditor: string, amount: number, type: string) => {
    let cardText = '';
    if (type === 'aggressive') {
      cardText = `🚨【催帳警報】同學，您有一筆由阿強代墊的【${aaFormTitle}】還款：$${amount} 元正等待由 ${debtor} 主動處置。常言道：『欠錢不還，泡麵沒調味包！』🍜 拜託快還給 ${creditor}，不然下週在系隊門口堵人囉！`;
    } else {
      cardText = `🥺【土吃完了，求救命！】大學生同胞 ${debtor} 救命！您的摯友 ${creditor} 為了代墊【${aaFormTitle}】的 $${amount}，錢包早已進加護病房，現在餐餐挖土配白開水。行行好快還這筆錢，讓他退出「吃土模式」重返人間，功德無量！`;
    }
    setActiveMemeCard({ show: true, text: cardText, memeType: type });
  };

  // Sync particular invoice to transaction
  const handleSyncInvoice = (invId: string) => {
    const matched = invoices.find(i => i.id === invId);
    if (!matched || matched.isSynced) return;

    // Convert to transaction
    const syncedCategory: CategoryType = matched.merchant.includes('書局') ? '書籍教材' : '學餐/宵夜';
    const newTx: Transaction = {
      id: Date.now().toString(),
      amount: matched.amount,
      category: syncedCategory,
      note: `發票[${matched.merchant}] - ${matched.details}`,
      date: new Date().toISOString(),
      isInvoiceSynced: true
    };

    setTransactions([newTx, ...transactions]);
    setInvoices(invoices.map(inv => inv.id === invId ? { ...inv, isSynced: true } : inv));
    if (user) {
      fbSaveTransaction(user.uid, newTx).catch(err => console.error(err));
      fbSaveInvoice(user.uid, { ...matched, isSynced: true }).catch(err => console.error(err));
    }
  };

  // Double-month check prize callback
  const triggerCheckPrizeSim = () => {
    setHasCheckedPrize(true);
    // Simulate prize result
    const updated = invoices.map((inv, idx) => {
      let result: any = '未中獎';
      if (idx === 1) result = '中獎200元'; // 7-11 invoice wins!
      return { ...inv, prizeChecked: true, prizeResult: result };
    });
    setInvoices(updated);

    // Show popup overlay indicating the "Eating bonus loaded!" notification
    setPrizeOverlay({
      show: true,
      won: true,
      amount: 200,
      message: '🎉 恭喜！發票 [7-11中正門市] 幸運對中六獎 $200 元加菜金！終於可以從吃土配白開水升級成有起司有大叉燒的麻辣拉麵囉！'
    });
  };

  // Delete manual transaction
  const handleRemoveTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    if (user) {
      fbDeleteTransaction(user.uid, id).catch(err => console.error("Firebase delete error:", err));
    }
  };

  // Start editing transaction
  const handleStartEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setEditNote(t.note);
    setEditAmount(Math.abs(t.amount).toString());
    setEditCategory(t.category);
  };

  // Save transaction changes
  const handleSaveChanges = () => {
    if (!editingTransaction) return;
    const amt = parseFloat(editAmount);
    if (isNaN(amt) || amt <= 0) {
      alert("請輸入有效的金額！");
      return;
    }
    const updatedTx: Transaction = {
      ...editingTransaction,
      amount: amt,
      category: editCategory,
      note: editNote || `${editCategory}記帳修改`
    };

    setTransactions(prev => prev.map(t => t.id === updatedTx.id ? updatedTx : t));
    if (user) {
      fbSaveTransaction(user.uid, updatedTx).catch(err => console.error("Firebase update tx error:", err));
    }

    setEditingTransaction(null);
  };

  // Theme definition for "Eat Soil Mode"
  // Soil Mode triggers whenever expensePercentage >= 100
  const isSoilMode = expensePercentage >= 100;
  const isWarningMode = expensePercentage >= 80 && expensePercentage < 100;

  // Color styles configuration dictionary
  const themeStyles = {
    headerBg: isSoilMode ? 'bg-[#3b3530]' : 'bg-gradient-to-r from-emerald-500 to-teal-600',
    primaryColor: isSoilMode ? 'text-amber-700' : 'text-emerald-500',
    accentColor: isSoilMode ? 'bg-amber-800' : 'bg-emerald-500',
    screenBg: isSoilMode ? 'bg-[#efebe4]' : 'bg-slate-50',
    cardBg: isSoilMode ? 'bg-amber-100/80 border-amber-200/50' : 'bg-white border-slate-100',
    btnBg: isSoilMode ? 'bg-amber-800 hover:bg-amber-900 text-amber-50' : 'bg-emerald-600 hover:bg-emerald-700 text-white',
    progressBar: isSoilMode ? 'bg-amber-800' : isWarningMode ? 'bg-amber-500' : 'bg-emerald-500',
    tabActive: isSoilMode ? 'text-amber-900 border-amber-900' : 'text-emerald-600 border-emerald-600'
  };

  // Custom SVG donut chart calculations for Categories
  const categoryTotals: Record<string, number> = {};
  transactions.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  return (
    <div id="uni-coin-app-simulator" className="flex flex-col items-center justify-center p-2 lg:p-4 min-h-[680px]">
      
      {/* Outer Smartphone hardware simulation cover */}
      <div className="relative w-full max-w-[370px] bg-slate-900 p-3 pb-4 rounded-[42px] shadow-2xl border-4 border-slate-800 ring-1 ring-white/10 overflow-hidden">
        
        {/* Smartphone Notch & Speaker */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-4 bg-slate-950 rounded-full flex justify-between items-center px-4 z-40">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          <span className="w-12 h-1 bg-slate-800 rounded-full" />
          <span className="w-2 h-2 rounded-full bg-blue-500/80 ring-2 ring-blue-500/20" />
        </div>

        {/* Smartphone Internal Screen Viewport */}
        <div className={`relative ${themeStyles.screenBg} text-slate-800 rounded-[32px] h-[670px] overflow-hidden flex flex-col transition-colors duration-500 select-none border border-slate-950`}>
          
          {/* iOS-like Header Grid bar */}
          <div className={`pt-6 px-5 pb-2 text-[11px] font-semibold flex justify-between items-center z-30 ${isSoilMode ? 'bg-[#3b3530]/5 text-black' : 'bg-white/20 text-slate-500'}`}>
            <span id="simulator-utc-time">02:54 UTC</span>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[9px] bg-slate-300/10 px-1 rounded border border-slate-400/20 text-slate-500">Live Proto</span>
              <Wifi className="w-3 h-3 text-slate-500" />
              <div className="flex items-center gap-0.5">
                <Battery className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>
          </div>

          {/* Core Interactive screens router */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-20">
            <AnimatePresence mode="wait">
              
              {/* SCREEN: HOME DASHBOARD */}
              {activeScreen === 'home' && (
                <motion.div
                  key="home-screen"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="space-y-4"
                >
                  {/* Cloud Firestore DB Sync Status Widget */}
                  <div className="bg-[#121622] border border-slate-800 p-2.5 rounded-2xl flex items-center justify-between text-[11px] text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-slate-800/80 flex items-center justify-center">
                        <i className={`bi bi-cloud-fill text-[11px] ${user ? 'text-emerald-400' : 'text-slate-500'}`}></i>
                      </div>
                      <div>
                        {user ? (
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-white text-[10px]">☁️ 雲端同步中</p>
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                          </div>
                        ) : (
                          <p className="font-semibold text-slate-400 text-[10px]">💾 本地離線暫存模式</p>
                        )}
                        <p className="text-[9px] text-slate-500">
                          {user ? `已連線: ${user.displayName || 'Google學生'}` : `登入備份可自動同步後端庫`}
                        </p>
                      </div>
                    </div>
                    {isFirebaseConfigured ? (
                      user ? (
                        <button
                          onClick={async () => {
                            await logOut();
                          }}
                          className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg hover:text-white transition text-[9px] font-bold"
                        >
                          登出
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await logInWithGoogle();
                            } catch (e) {
                              alert("對應 Firebase 目前條款尚未被完全確認，請稍後重試。");
                            }
                          }}
                          className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-[9px] font-bold"
                        >
                          Google 登入
                        </button>
                      )
                    ) : (
                      <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/10" title="連線待配置中">
                        待授權
                      </span>
                    )}
                  </div>
                  {/* Student Allowance Budget Gauge Area */}
                  <div className={`relative p-4 rounded-2xl border shadow-inner ${themeStyles.cardBg} transition-all duration-300`}>
                    
                    {/* Dirt Mode Banner warning if active */}
                    {isSoilMode && (
                      <div className="mb-3 p-2.5 bg-amber-950 text-amber-100 rounded-lg text-[11px] flex items-center gap-2 font-semibold">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <div>
                          <p className="text-amber-300 font-bold">⚠️ 警報：您已進入【吃土模式】！</p>
                          <p className="text-[10px] text-amber-200 font-normal">本月生活費歸零。介面強制轉至黑白灰原土灰主題，直到增加預算或下月生活費撥款。</p>
                        </div>
                      </div>
                    )}

                    {isWarningMode && (
                      <div className="mb-3 p-2.5 bg-amber-500/10 text-amber-800 rounded-lg text-[11px] flex items-center gap-2 border border-amber-500/20">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-amber-700 font-bold">錢包在哭泣！限額已用 80% 😭</p>
                          <p className="text-[10px] text-amber-600 font-normal">再買手搖飲料就不只是月底吃土了，今晚考慮去宿舍啃泡麵配自來水吧！</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 bg-slate-100/60 p-1 px-2 rounded-lg border border-slate-200/50 w-fit">
                          <span className="text-[9px] text-slate-500 font-bold">預算月份：</span>
                          <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-transparent text-slate-705 text-[9px] font-black outline-none cursor-pointer font-mono"
                          >
                            {availableMonths.map(m => (
                              <option key={m} value={m}>{m} 月</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">當月賸餘生活費 (NTD)</p>
                        <h3 className={`text-2xl font-black tracking-tight ${remainingAllowance < 0 ? 'text-red-650' : 'text-slate-800'}`}>
                          ${remainingAllowance.toLocaleString()} 元
                        </h3>
                      </div>
                      <span className={`p-1.5 rounded-xl ${isSoilMode ? 'bg-amber-800/10 text-amber-800' : 'bg-emerald-500/10 text-emerald-600'}`}>
                        <Coins className="w-5 h-5" />
                      </span>
                    </div>

                    {/* Compact budget details sliders */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/40">
                      <div>
                        <p className="text-[10px] text-slate-400">總設定限額</p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-slate-600">${monthlyLimit}</span>
                          <button 
                            id="btn-edit-allowance"
                            onClick={() => {
                              const v = prompt("請輸入您的本月生活費上限 (NTD):", monthlyLimit.toString());
                              if (v) {
                                const n = parseInt(v);
                                if (!isNaN(n)) {
                                  setMonthlyLimit(n);
                                  if (user) {
                                    fbSaveUserSetting(user.uid, { monthlyLimit: n }).catch(err => console.error(err));
                                  }
                                }
                              }
                            }}
                            className="text-[10px] text-blue-500 hover:underline"
                          >
                            修改
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">當前已花費</p>
                        <p className="text-xs font-bold text-slate-600">${totalExpenses.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Progress slider bar matching PRD P2 */}
                    <div className="mt-3">
                      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${themeStyles.progressBar}`}
                          style={{ width: `${Math.min(expensePercentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 mt-1">
                        <span>預算刻度 0%</span>
                        <span className="font-bold">{expensePercentage.toFixed(0)}%</span>
                        <span>100% (吃土)</span>
                      </div>
                    </div>

                    {/* Dirt eating fun trigger */}
                    {isSoilMode && (
                      <div className="mt-3 text-center border border-dashed border-amber-300 p-2 rounded-lg bg-amber-50">
                        <p className="text-[10px] text-amber-800 italic font-semibold">
                          🍞「今日菜單：椰蓉黏土 搭配 特調沙塵暴開水」
                        </p>
                      </div>
                    )}
                  </div>

                   {/* Core Fast Accounts trigger button (Must Have P0) */}
                   <div className="space-y-3">
                     <button
                       id="btn-homepage-quick-add"
                       onClick={() => {
                         setActiveScreen('quick-add');
                       }}
                       className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-900 text-white rounded-xl shadow-md hover:bg-slate-800 active:scale-95 transition"
                     >
                       <Plus className="w-4 h-4 text-emerald-400 animate-pulse" />
                       <span className="text-xs font-bold">一鍵記帳</span>
                     </button>

                   </div>

                   {/* Student Transactions Listing (Must Have Student Labels in PRD) */}
                   <div>
                     <div className="flex items-center justify-between mb-2">
                       <h4 className="text-xs font-bold text-slate-400 flex items-center gap-1">
                         <FileText className="w-3.5 h-3.5" />
                         學生記帳明細
                       </h4>
                       <span className="text-[10px] text-slate-400 font-medium">點擊 ✏️ 編輯 / 🗑️ 刪除</span>
                     </div>

                     {monthlyTransactions.length === 0 ? (
                       <div className="bg-slate-200/40 border border-dashed border-slate-300/60 p-6 rounded-2xl text-center space-y-1">
                         <Coins className="w-6 h-6 text-slate-400 mx-auto" />
                         <p className="text-xs font-semibold text-slate-500">此月份尚未有記帳記錄喔</p>
                         <p className="text-[10px] text-slate-400">點擊上方任一快捷一鍵記帳，或點擊一鍵記帳快速登載吧！</p>
                       </div>
                    ) : (
                      <div className="space-y-2">
                        {monthlyTransactions.map(t => (
                          <div 
                            key={t.id} 
                            className={`p-3 rounded-xl border flex items-center justify-between transition group ${themeStyles.cardBg}`}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* Dynamic Icon with Bootstrap Icons */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                t.category === '學餐/宵夜' ? 'bg-amber-100 text-amber-700' :
                                t.category === '書籍教材' ? 'bg-blue-100 text-blue-700' :
                                t.category === '學雜費' ? 'bg-purple-100 text-purple-700' :
                                t.category === '房租水電' ? 'bg-indigo-100 text-indigo-700' :
                                t.category === '社團系隊' ? 'bg-emerald-100 text-emerald-700' :
                                t.category === '社交娛樂' ? 'bg-rose-100 text-rose-700' :
                                t.category === '交通費' ? 'bg-cyan-100 text-cyan-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                <i className={`bi ${getCategoryIcon(t.category)} text-sm`}></i>
                              </div>
                              <div>
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold text-slate-700">{t.note}</span>
                                  {t.isInvoiceSynced && (
                                    <span className="text-[8px] bg-sky-100 text-sky-700 px-1 py-0.2 rounded font-semibold border border-sky-200">
                                      載具同步
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                                  <span>{t.category}</span>
                                  <span>•</span>
                                  <span>{new Date(t.date).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="text-xs font-extrabold text-slate-800">
                                -${t.amount}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <button
                                  onClick={() => handleStartEdit(t)}
                                  className="p-1 text-slate-400 hover:text-indigo-500 rounded transition opacity-60 hover:opacity-100 cursor-pointer"
                                  title="修改紀錄"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleRemoveTransaction(t.id)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded transition opacity-60 hover:opacity-100 cursor-pointer"
                                  title="刪除紀錄"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fun University Humors */}
                  <div className={`p-3 rounded-xl border-t ${themeStyles.cardBg}`}>
                    <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1 text-center">
                      🤖 UniCoin 開源幽默理財貼士
                    </p>
                    <p className="text-[11px] text-slate-505 text-center leading-relaxed font-sans">
                      {remainingAllowance >= 3000 ? '「恭喜您！目前資金充足。月底加蛋不再是夢想，但還是要提防突然收取的期末聚餐代墊喔！」' :
                       remainingAllowance >= 1000 ? '「警報！資金降至三位數警戒，請主動關閉社團聚餐，不然今晚我們就約在大專學餐大門口吃免錢湯麵。」' :
                       '「目前您的生活費餘額極其嚴峻。請出沒在學會活動看有沒有多的便當，或者趕快催促小明把上學期的代墊款吐出來！」'}
                    </p>
                  </div>
                </motion.div>
              )}

                    {/* SCREEN: QUICK ADD LEDGER (MUST HAVE P0 CORE) */}
              {activeScreen === 'quick-add' && (
                <motion.div
                  key="add-screen"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4 font-sans"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <span className="bg-emerald-100 text-emerald-600 w-2 h-2 rounded-full inline-block" />
                        一鍵智慧記帳面板
                      </h3>
                      <p className="text-[10px] text-slate-400">輸入數字再點下方類別，即享一鍵瞬間極速入帳！</p>
                    </div>
                    <button 
                      onClick={() => setActiveScreen('home')}
                      className="text-xs text-slate-400 hover:text-slate-600 bg-slate-200/50 px-2 py-1 rounded-md"
                    >
                      返回
                    </button>
                  </div>

                  {/* Display & input area */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-sm select-none">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-slate-400 font-bold font-mono">手動輸入或使用預設金額</span>
                      <span className="text-[10px] text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded-full">
                        NTD 元
                      </span>
                    </div>
                    
                    <div className="flex items-baseline justify-between">
                      <div className="text-3xl font-black text-slate-800 font-mono">
                        ${quickAmount || '0'}
                      </div>
                      <input 
                        type="text"
                        placeholder="選填備註 (如：加奶蛋)"
                        value={quickNote}
                        onChange={(e) => setQuickNote(e.target.value)}
                        className="text-right text-xs text-slate-500 bg-transparent border-b border-dashed border-slate-300 focus:border-emerald-500 outline-none w-1/2"
                      />
                    </div>

                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-100/80">
                      <span className="text-[10px] text-slate-400 font-bold">選擇記帳日期：</span>
                      <input
                        type="date"
                        value={transactionDate}
                        onChange={(e) => setTransactionDate(e.target.value)}
                        className="text-right text-xs font-bold font-mono text-slate-600 bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-lg px-2 py-0.5 outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Student predefined high-frequency categories tags */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                      點選類別：
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['學餐/宵夜', '書籍教材', '學雜費', '房租水電', '社團系隊', '社交娛樂', '交通費', '其他'] as CategoryType[]).map(cat => (
                        <button
                          key={cat}
                          onClick={() => {
                            setQuickCategory(cat);
                          }}
                          className={`py-2 px-0.5 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 ${
                            quickCategory === cat 
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 active:scale-95'
                          }`}
                        >
                          <i className={`bi ${getCategoryIcon(cat)} text-xs ${quickCategory === cat ? 'text-emerald-100' : 'text-slate-400'}`}></i>
                          <span>{cat}</span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1.5 text-center italic">
                      💡 提示：點選上方的類別以進行分類，不輸入金額將會自動套用該類別預設值！
                    </p>
                  </div>

                  {/* Digital Num Pad integrated into simulator (Ensures extreme compliance with PRD "開啟App預設為數字鍵盤，1鍵完成一筆記帳") */}
                  <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 space-y-2 select-none">
                    <div className="grid grid-cols-3 gap-2">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                        <button
                          key={num}
                          onClick={() => handleKeypadPress(num)}
                          className="py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 active:scale-95 transition text-sm font-mono"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={() => handleKeypadPress('C')}
                        className="py-2 bg-rose-950/40 text-rose-400 font-bold rounded-lg hover:bg-rose-900/60 transition text-xs"
                      >
                        清除
                      </button>
                      <button
                        onClick={() => handleKeypadPress('0')}
                        className="py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition text-sm font-mono"
                      >
                        0
                      </button>
                      <button
                        onClick={() => handleKeypadPress('←')}
                        className="py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition text-sm font-mono flex items-center justify-center"
                      >
                        ←
                      </button>
                    </div>

                    {/* Quick send trigger */}
                    <button
                      id="btn-keyboard-submit"
                      onClick={() => {
                        handleQuickAdd();
                      }}
                      className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold font-mono transition shadow text-xs text-center hover:opacity-90 active:scale-[0.98] cursor-pointer"
                    >
                      {quickAmount ? `送出記帳 ($${quickAmount})` : `使用預設值送出 ($${getCategoryDefaultAmount(quickCategory)})`}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* SCREEN: GROUP AA SPLITTING MOD (Must Have & Should Have P1 AA Split Billing) */}
              {activeScreen === 'aa-split' && (
                <motion.div
                  key="aa-screen"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-505" />
                        學生群組 AA 分帳系統
                      </h3>
                      <p className="text-[10px] text-slate-400">多代墊、少摩擦，自動算好微還款路徑</p>
                    </div>
                    <button 
                      onClick={() => setActiveScreen('home')}
                      className="text-xs text-slate-400 hover:text-slate-600 bg-slate-200/50 px-2 py-1 rounded-md"
                    >
                      返回
                    </button>
                  </div>

                  {/* AA Input form */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 space-y-2.5 shadow-sm text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold">聚會名稱</label>
                        <input
                          id="input-aa-title"
                          type="text"
                          value={aaFormTitle}
                          onChange={(e) => setAaFormTitle(e.target.value)}
                          className="w-full mt-1 p-1 bg-slate-50 border rounded outline-none text-slate-800"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold">代墊付款人</label>
                        <select
                          id="input-aa-paid-by"
                          value={aaFormPaidBy}
                          onChange={(e) => setAaFormPaidBy(e.target.value)}
                          className="w-full mt-1 p-1 bg-slate-50 border rounded outline-none text-slate-850 font-bold text-xs cursor-pointer"
                        >
                          {Array.from(new Set([
                            user?.displayName || '我', 
                            ...friends.map(f => f.displayName)
                          ])).filter(Boolean).map(name => (
                            <option key={name} value={name}>{name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold">總金額 (NTD)</label>
                      <input
                        id="input-aa-total"
                        type="number"
                        value={aaFormTotal}
                        onChange={(e) => setAaFormTotal(e.target.value)}
                        className="w-full mt-1 p-1 bg-slate-50 border rounded font-mono outline-none text-emerald-600 font-bold text-sm"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] text-slate-400 font-bold">👥快速從好友清單點選成員：</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setAaParticipantsText(friends.map(fr => fr.displayName).join(', '))}
                            className="text-[9px] text-indigo-600 hover:underline font-bold cursor-pointer"
                          >
                            全選好友
                          </button>
                          <button
                            type="button"
                            onClick={() => setAaParticipantsText('')}
                            className="text-[9px] text-slate-500 hover:underline font-bold cursor-pointer"
                          >
                            清空
                          </button>
                        </div>
                      </div>
                      
                      {/* Interactive Friends list selectors */}
                      <div className="flex flex-wrap gap-1 p-1.5 bg-slate-50 rounded-xl border border-dashed border-slate-200 mb-2">
                        {friends.map(f => {
                          const parts = aaParticipantsText.split(',').map(s => s.trim()).filter(Boolean);
                          const isSelected = parts.includes(f.displayName);
                          return (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  const updated = parts.filter(p => p !== f.displayName);
                                  setAaParticipantsText(updated.join(', '));
                                } else {
                                  const updated = [...parts, f.displayName];
                                  setAaParticipantsText(updated.join(', '));
                                }
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition duration-150 cursor-pointer flex items-center gap-1 ${
                                isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-105'
                              }`}
                            >
                              <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-slate-300'}`} />
                              {f.displayName}
                            </button>
                          );
                        })}
                      </div>

                      <label className="text-[10px] text-slate-400 font-bold">參與對象成員 (可手動微調，以逗號分隔)</label>
                      <input
                        id="input-aa-participants"
                        type="text"
                        value={aaParticipantsText}
                        onChange={(e) => setAaParticipantsText(e.target.value)}
                        className="w-full mt-1 p-1 bg-slate-50 border rounded outline-none text-slate-800 text-[11px]"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        id="btn-create-aa-group"
                        onClick={handleCreateAAGroup}
                        className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      >
                        📥 儲存此分帳/代墊
                      </button>
                      <button
                        type="button"
                        onClick={handleResetAAForm}
                        className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[11px] font-bold border border-slate-200 transition-colors cursor-pointer"
                        title="清除目前輸入並重新填寫"
                      >
                        🧹 清除重設
                      </button>
                    </div>
                  </div>

                  {/* Solver Output representation */}
                  <div className="bg-slate-900 text-slate-100 p-3.5 rounded-2xl space-y-2 border border-slate-850">
                    <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center justify-between">
                      <span>✓ 最佳最小還款路徑推薦</span>
                      <span className="text-[8px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.2 rounded">Greedy Solver</span>
                    </p>

                    {calculatedDebts.length === 0 ? (
                      <p className="text-[10px] text-slate-400">請確認輸入成員姓名和代墊款金額喔</p>
                    ) : (
                      <div className="space-y-2">
                        {calculatedDebts
                          .filter(debt => !showOnlyWhatIOwe || debt.debtor === viewerName)
                          .map((debt, index) => (
                            <div key={index} className="p-2 bg-slate-950 rounded-lg flex flex-col gap-1.5 text-xs">
                              <div className="flex justify-between items-center text-[11px]">
                                <span>
                                  💁‍ 學生 <b className="text-white font-bold">{debt.debtor}</b> 應給付 <b className="text-indigo-300 font-bold">${debt.amount}</b> 給 <b className="text-white font-bold">{debt.creditor}</b>
                                </span>
                              </div>

                              {/* Memetastic trigger card sharing directly on screen */}
                              <div className="flex gap-1.5 pt-1 border-t border-slate-900/40">
                                <button
                                  onClick={() => handleGenerateMemeCard(debt.debtor, debt.creditor, debt.amount, 'aggressive')}
                                  className="flex-1 py-1 px-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded text-[9px] hover:text-white transition"
                                >
                                  {`🤬 催錢卡 (暴躁)`}
                                </button>
                                <button
                                  onClick={() => handleGenerateMemeCard(debt.debtor, debt.creditor, debt.amount, 'soil-eating')}
                                  className="flex-1 py-1 px-1.5 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 rounded text-[9px] hover:text-white transition"
                                >
                                  {`🥺 哭窮卡 (可憐)`}
                                </button>
                              </div>
                            </div>
                          ))}
                        
                        {showOnlyWhatIOwe && calculatedDebts.filter(debt => debt.debtor === viewerName).length === 0 && (
                          <div className="p-2 bg-slate-950 rounded-lg text-center text-slate-400 text-[10px] italic">
                            🎉 此大會中，您不存在未結清欠款！
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Option segment to see who I owe money to (我欠誰錢) */}
                  {(() => {
                    // Gather all unique participants from all sources dynamically
                    const allParticipants = Array.from(
                      new Set([
                        '小明', '阿強', '小美', '阿珍',
                        ...aaGroups.flatMap(g => g.participants),
                        ...calculatedDebts.map(d => d.debtor),
                        ...calculatedDebts.map(d => d.creditor)
                      ])
                    ).filter(Boolean);

                    return (
                      <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-2xl space-y-2.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <label className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                            <User className="w-3.5 h-3.5 text-indigo-600" />
                            設定我的視角 (觀看者):
                          </label>
                          <select
                            value={viewerName}
                            onChange={(e) => setViewerName(e.target.value)}
                            className="p-1 px-1.5 bg-white border border-slate-200 rounded font-bold text-slate-800 outline-none text-[10px]"
                          >
                            {allParticipants.map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 pt-1.5 border-t border-indigo-100/40">
                          <input
                            type="checkbox"
                            id="toggle-what-i-owe"
                            checked={showOnlyWhatIOwe}
                            onChange={(e) => setShowOnlyWhatIOwe(e.target.checked)}
                            className="rounded border-slate-350 text-indigo-600 h-3.5 w-3.5 cursor-pointer accent-indigo-600"
                          />
                          <label htmlFor="toggle-what-i-owe" className="text-[11px] text-slate-600 font-bold flex-1 cursor-pointer">
                            🔍 啟用「避債模式」：僅顯示我 ({viewerName}) 欠誰錢
                          </label>
                        </div>

                        {/* Consolidated breakdown of historical + pending debts for viewerName */}
                        {showOnlyWhatIOwe && (
                          <div className="p-2.5 bg-white rounded-xl border border-indigo-100/60 mt-2 space-y-1.5 shadow-sm">
                            <p className="text-[10px] text-indigo-700 font-extrabold flex items-center gap-1.5">
                              <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                              【{viewerName}】的未結清應付款明細：
                            </p>
                            {(() => {
                              const viewerDebts: Record<string, number> = {};
                              aaGroups.forEach(g => {
                                // Ignore settled/canceled group records
                                if (g.status === 'completed' || g.status === 'canceled') return;

                                const settledList = g.settledParticipants || [];
                                if (g.participants.includes(viewerName) && g.paidBy !== viewerName && !settledList.includes(viewerName)) {
                                  const share = g.totalAmount / g.participants.length;
                                  viewerDebts[g.paidBy] = (viewerDebts[g.paidBy] || 0) + share;
                                }
                              });

                              const debts = Object.entries(viewerDebts);
                              if (debts.length === 0) {
                                return (
                                  <p className="text-[10px] text-slate-400 italic py-1 leading-normal text-center">
                                    🎉 大吉大利！您({viewerName})在所有歷史群組中皆無欠款！
                                  </p>
                                );
                              }

                              return (
                                <div className="space-y-1">
                                  {debts.map(([creditor, amt]) => (
                                    <div key={creditor} className="flex justify-between items-center text-[10px] bg-indigo-50/20 p-2 rounded border border-indigo-50/50">
                                      <span className="text-slate-600">
                                        💸 應付給 <b>{creditor}</b>：
                                      </span>
                                      <span className="font-extrabold text-red-650 font-mono text-[11px]">
                                        ${Math.round(amt)} 元
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* AA Split history */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">分帳歷史記錄</p>
                    {aaGroups.map(g => (
                      <div 
                        key={g.id} 
                        className={`p-3 rounded-xl border flex flex-col gap-2 transition ${
                          g.status === 'completed' ? 'opacity-75 bg-emerald-50/40 border-emerald-250' :
                          g.status === 'canceled' ? 'opacity-60 bg-slate-100 border-slate-300 line-through' :
                          'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className={`font-bold text-xs ${g.status === 'canceled' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{g.name}</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">
                              共 ${g.totalAmount} 元 • {g.participants.length} 人 (由{g.paidBy}代墊)
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              g.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              g.status === 'canceled' ? 'bg-slate-200 text-slate-500' :
                              'bg-amber-50 text-amber-700 border border-amber-200/50'
                            }`}>
                              {g.status === 'completed' ? '已收清 ✔' :
                               g.status === 'canceled' ? '已取消 ✖' :
                               '收帳中 ⏳'}
                            </span>
                            <button
                              onClick={() => handleDeleteAAGroup(g.id, g.name)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 transition cursor-pointer"
                              title="刪除此分帳記錄"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-current" />
                            </button>
                          </div>
                        </div>

                        {/* Member repayment status check-off */}
                        {g.status !== 'canceled' && (
                          <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 space-y-1 mt-1 text-left">
                            <p className="text-[9px] text-slate-550 font-extrabold flex items-center gap-1">
                              <span>📌 誰還錢了？(點擊勾選切換):</span>
                            </p>
                            <div className="flex flex-wrap gap-1 font-sans">
                              {g.participants
                                .filter(p => p !== g.paidBy)
                                .map(p => {
                                  const isSettled = (g.settledParticipants || []).includes(p);
                                  const shareAmount = Math.round((g.totalAmount / g.participants.length) * 10) / 10;
                                  return (
                                    <button
                                      key={p}
                                      type="button"
                                      onClick={() => handleToggleParticipantSettled(g.id, p)}
                                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-0.5 transition-all cursor-pointer ${
                                        isSettled
                                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                          : 'bg-rose-50/70 text-rose-750 border border-rose-100 hover:bg-rose-100'
                                      }`}
                                    >
                                      <span className={isSettled ? 'line-through opacity-70' : ''}>{p} ({shareAmount}元)</span>
                                      <span>{isSettled ? '已還 ✔' : '未還 ⏳'}</span>
                                    </button>
                                  );
                                })}
                              {g.participants.filter(p => p !== g.paidBy).length === 0 && (
                                <span className="text-[9px] text-slate-400 italic">無其他成員欠約</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Interactive complete & cancel controls with ticks and crosses */}
                        <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-100/10">
                          <span className="text-[9px] text-slate-400">變更分帳狀態:</span>
                          <div className="flex items-center gap-1.5 font-mono">
                            <button
                              onClick={() => handleUpdateAAStatus(g.id, g.status === 'completed' ? 'pending' : 'completed')}
                              className={`p-1 px-2 rounded-lg text-[9px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                g.status === 'completed'
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-slate-100/80 hover:bg-emerald-50 text-emerald-600'
                              }`}
                              title="啟用 / 撤銷【完成分帳】"
                            >
                              <Check className="w-3 h-3 text-current stroke-[3.5]" />
                              <span>{g.status === 'completed' ? '已付清' : '設為付清'}</span>
                            </button>
                            <button
                              onClick={() => handleUpdateAAStatus(g.id, g.status === 'canceled' ? 'pending' : 'canceled')}
                              className={`p-1 px-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 transition cursor-pointer ${
                                g.status === 'canceled'
                                  ? 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-slate-100/80 hover:bg-rose-50 text-rose-600'
                              }`}
                              title="啟用 / 撤銷【取消分帳】"
                            >
                              <X className="w-3 h-3 text-current stroke-[3.5]" />
                              <span>{g.status === 'canceled' ? '已取消' : '設為不可用'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* SCREEN: ELECTRONIC INVOICES & AUTOMATIC PRIZE LUCK (Should Have P1) */}
              {activeScreen === 'invoice' && (
                <motion.div
                  key="invoice-screen"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4 font-sans text-xs"
                >
                  <div className="flex justify-between items-center font-sans">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Receipt className="w-3.5 h-3.5 text-blue-500" />
                        發票載具與智慧對獎系統
                      </h3>
                      <p className="text-[10px] text-slate-400">雙月 25 日自動比對發票中獎結果</p>
                    </div>
                    <button 
                      onClick={() => setActiveScreen('home')}
                      className="text-xs text-slate-400 hover:text-slate-600 bg-slate-200/50 px-2 py-1 rounded-md"
                    >
                      返回
                    </button>
                  </div>

                  {/* Carrier Bind Form Block */}
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 space-y-2 shadow-sm text-xs">
                    <p className="text-[11px] font-bold text-slate-500">串接手機條碼載具 (例如: /AB12345)</p>
                    <div className="flex gap-2">
                      <input
                        id="input-carrier-barcode"
                        type="text"
                        value={carrierCode}
                        onChange={(e) => setCarrierCode(e.target.value)}
                        placeholder="請輸入手機載具條碼"
                        className="flex-1 p-2 bg-slate-50 border rounded-lg text-xs font-mono font-bold uppercase outline-none"
                      />
                      <button
                        id="btn-confirm-carrier"
                        onClick={() => alert(`成功註冊手機戴具條碼「${carrierCode}」，每日將為您靜默同步消費資料。`)}
                        className="py-1.5 px-3 bg-blue-600 text-white rounded-lg font-bold text-xs"
                      >
                        綁定
                      </button>
                    </div>
                  </div>

                  {/* Silent daily simulation invoices area */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">載具已同步發票 (背景每日匯入)</p>
                      
                      {/* MoSCoW trigger check prize */}
                      <button
                        id="btn-simulate-draw-prize"
                        onClick={triggerCheckPrizeSim}
                        className="text-[9px] bg-indigo-650 hover:bg-slate-900 text-white px-2 py-1 rounded-md font-bold flex items-center gap-1"
                      >
                        🎯 雙數月25日 模擬對獎
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {invoices.map(inv => (
                        <div key={inv.id} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between text-xs transition hover:border-blue-300">
                          <div>
                            <div className="flex items-center gap-1.55">
                              <span className="font-bold text-slate-700">{inv.merchant}</span>
                              <span className="text-[9px] text-slate-400 font-mono">{inv.date}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">{inv.details}</p>
                            
                            {/* Sync Status to account ledgers manual override tool */}
                            <div className="flex items-center gap-1.5 mt-2">
                              {inv.isSynced ? (
                                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100 flex items-center gap-0.5">
                                  <Check className="w-2.5 h-2.5" /> 已納入記帳支出
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleSyncInvoice(inv.id)}
                                  className="text-[9px] text-blue-500 hover:text-white hover:bg-blue-600 border border-blue-400 px-1.5 py-0.2 rounded transition"
                                >
                                  📥 轉記此發票帳目到首頁
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-1 font-mono">
                            <span className="font-black text-slate-800">${inv.amount}</span>
                            
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                              inv.prizeResult === '中獎200元' ? 'bg-rose-500/10 text-rose-500 border border-rose-300/30' :
                              inv.prizeResult === '未中獎' ? 'bg-slate-100 text-slate-400' :
                              'bg-amber-100 text-amber-600'
                            }`}>
                              {inv.prizeResult}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SCREEN: BUDGETS & CHARTS ANALYZER PANEL (Could Have P2) */}
              {activeScreen === 'chart' && (
                <motion.div
                  key="chart-screen"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4 font-sans text-xs"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <ChartIcon className="w-3.5 h-3.5 text-orange-400" />
                        學生預算設定與分析
                      </h3>
                      <p className="text-[10px] text-slate-400">了解每月資金去向，規避吃土窘境</p>
                    </div>
                    <button 
                      onClick={() => setActiveScreen('home')}
                      className="text-xs text-slate-400 hover:text-slate-600 bg-slate-200/50 px-2 py-1 rounded-md"
                    >
                      返回
                    </button>
                  </div>

                  {/* Dynamic Month Consumer Analysis Card */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                      <div>
                        <p className="text-xs font-black text-slate-800">消費分析報告</p>
                        <p className="text-[10px] text-slate-400">目前分析以月份歸檔與結算</p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100/60 p-2 rounded-lg border border-slate-200/50">
                        <span className="text-[9px] text-slate-500 font-bold">選擇月份：</span>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="bg-transparent text-slate-700 text-[9.5px] font-black outline-none cursor-pointer font-mono"
                        >
                          {availableMonths.map(m => (
                            <option key={m} value={m}>{m} 月</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                      {/* Left: Dynamic Month aggregate bubble */}
                      <div className="bg-slate-50 border border-slate-150 rounded-xl p-3 text-center space-y-1">
                        <p className="text-[10.5px] text-slate-400 font-medium font-mono">{selectedMonth} 月總支出</p>
                        <p className="text-xl font-black text-emerald-600 font-mono">${categorySummary.total} <span className="text-[10px] font-normal text-slate-500">元</span></p>
                        <div className="pt-1.5 border-t border-slate-200 flex justify-around text-[9px] text-slate-400">
                          <div>
                            <span>預算上限</span>
                            <p className="font-bold text-slate-600 font-mono">${monthlyLimit}</p>
                          </div>
                          <div className="border-r border-slate-200 h-4 self-center" />
                          <div>
                            <span>使用佔比</span>
                            <p className="font-bold text-slate-600 font-mono">{expensePercentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>

                      {/* Right: Dynamic Category progress bars */}
                      <div className="space-y-3.5">
                        <p className="text-[10px] font-bold text-slate-400">各類別消費佔比：</p>
                        <div className="space-y-2.5">
                          {Object.entries(categorySummary.summary).map(([cat, amt]) => {
                            const val = amt as number;
                            const pct = categorySummary.total > 0 ? (val / categorySummary.total) * 100 : 0;
                            if (val === 0) return null; // Avoid showing unused categories
                            return (
                              <div key={cat} className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                                  <span className="flex items-center gap-1">
                                    <span className={`w-2 h-2 rounded-full ${
                                      cat === '學餐/宵夜' ? 'bg-amber-400' :
                                      cat === '書籍教材' ? 'bg-blue-400' :
                                      cat === '學雜費' ? 'bg-purple-400' :
                                      cat === '房租水電' ? 'bg-indigo-400' :
                                      cat === '社團系隊' ? 'bg-emerald-400' :
                                      cat === '社交娛樂' ? 'bg-rose-400' :
                                      cat === '交通費' ? 'bg-cyan-400' :
                                      'bg-slate-400'
                                    }`} />
                                    {cat}
                                  </span>
                                  <span className="font-mono text-slate-500">${val} ({pct.toFixed(0)}%)</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    style={{ width: `${pct}%` }} 
                                    className={`h-full transition-all duration-500 ${
                                      cat === '學餐/宵夜' ? 'bg-amber-400' :
                                      cat === '書籍教材' ? 'bg-blue-400' :
                                      cat === '學雜費' ? 'bg-purple-400' :
                                      cat === '房租水電' ? 'bg-indigo-400' :
                                      cat === '社團系隊' ? 'bg-emerald-400' :
                                      cat === '社交娛樂' ? 'bg-rose-400' :
                                      cat === '交通費' ? 'bg-cyan-400' :
                                      'bg-slate-400'
                                    }`}
                                  />
                                </div>
                              </div>
                            );
                          })}
                          
                          {categorySummary.total === 0 && (
                            <div className="text-center py-6 text-slate-400/80 space-y-1 italic">
                              <p className="text-[10px]">這個月在各類別都還沒有記帳支出的紀錄喔 🍃</p>
                              <p className="text-[9px]">可點擊「一鍵記帳」來為此月份新增一筆手動帳目！</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progressive Alert warning control helper */}
                  <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl text-xs space-y-1.5 font-sans">
                    <p className="font-bold text-orange-400">💡 大學生避坑實用理財指南</p>
                    <div className="text-[10px] text-slate-400 space-y-1 leading-relaxed">
                      <p>1. <strong className="text-slate-350">「先存後花」原則</strong>：收到每個月的生活費或打工薪水時，先撥出固定比例（如 15%）存入不常動用的帳戶，其餘才是可支配餘額。</p>
                      <p>2. <strong className="text-slate-350">代墊款立刻記帳</strong>：幫室友、同學代買或聚餐先付時，最容易因漏記而忘記收回，形成隱形開銷。請多善用「群組分帳」進行即時追蹤與催收！</p>
                      <p>3. <strong className="text-slate-350">辨別「想要」與「需要」</strong>：減少每日習慣性手搖飲與昂貴外送，多利用學餐或順路外帶，每個月省下來的零頭積少成多非常可觀。</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SCREEN: USER ACCOUNT & NOTIFICATION CENTER (MUST HAVE FOR SYNCHRONIZATION) */}
              {activeScreen === 'account' && (
                <motion.div
                  key="account-screen"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4 font-sans text-xs"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                        個人與雲端通知
                      </h3>
                      <p className="text-[10px] text-slate-400">登錄帳號串連群組分帳，實時同步催收訊息</p>
                    </div>
                    <button 
                      onClick={() => setActiveScreen('home')}
                      className="text-xs text-slate-400 hover:text-slate-600 bg-slate-200/50 px-2 py-1 rounded-md"
                    >
                      返回
                    </button>
                  </div>

                  {splitFeedback && (
                    <div className={`p-2.5 rounded-xl border text-[10px] flex items-center gap-1.5 ${
                      splitFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                      'bg-sky-50 border-sky-200 text-sky-850'
                    }`}>
                      <Shield className="w-3.5 h-3.5" />
                      {splitFeedback.text}
                    </div>
                  )}

                  {!user ? (
                    /* LOGGED OUT: Multi-auth interface options */
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                        <div className="flex justify-center border-b border-slate-100 pb-2.5">
                          <button
                            type="button"
                            onClick={() => { setIsSignUpMode(false); setAuthError(''); }}
                            className={`flex-1 text-center pb-2.5 font-bold text-xs ${!isSignUpMode ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-slate-400'}`}
                          >
                            信箱登入
                          </button>
                          <button
                            type="button"
                            onClick={() => { setIsSignUpMode(true); setAuthError(''); }}
                            className={`flex-1 text-center pb-2.5 font-bold text-xs ${isSignUpMode ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-slate-400'}`}
                          >
                            信箱註冊
                          </button>
                        </div>

                        {authError && (
                          <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[10px]">
                            ⚠️ {authError}
                          </div>
                        )}

                        <div className="space-y-2">
                          {isSignUpMode && (
                            <>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">顯示姓名/科系</label>
                                <div className="relative">
                                  <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                  <input
                                    type="text"
                                    placeholder="例如: 阿強 (中正資工)"
                                    value={displayNameInput}
                                    onChange={(e) => setDisplayNameInput(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500">手機號碼 (必填，供好友點選/搜尋尋找)</label>
                                <div className="relative">
                                  <Phone className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                  <input
                                    type="text"
                                    placeholder="例如: 0912345678"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs"
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">電子信箱 Address</label>
                            <div className="relative">
                              <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                              <input
                                type="email"
                                placeholder="student@example.com"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500">登入密碼 Password</label>
                            <div className="relative">
                              <Lock className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                              <input
                                type="password"
                                placeholder="大於 6 位數密碼"
                                value={passwordInput}
                                onChange={(e) => setPasswordInput(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs"
                              />
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            if (!emailInput || !passwordInput) {
                              setAuthError('請填寫完整信箱與密碼！');
                              return;
                            }
                            if (isSignUpMode && !phoneInput.trim()) {
                              setAuthError('請填寫手機號碼以便好友能搜尋您！');
                              return;
                            }
                            setAuthLoading(true);
                            setAuthError('');
                            try {
                              if (isSignUpMode) {
                                if (passwordInput.length < 6) {
                                  throw new Error('密碼長度不可小於 6 位字元');
                                }
                                await signUpWithEmail(emailInput, passwordInput, displayNameInput || '新大學生', phoneInput.trim());
                              } else {
                                await logInWithEmail(emailInput, passwordInput);
                              }
                              setEmailInput('');
                              setPasswordInput('');
                              setDisplayNameInput('');
                              setPhoneInput('');
                            } catch (err: any) {
                              setAuthError(err.message || '認證程序發生錯誤，請重試');
                            } finally {
                              setAuthLoading(false);
                            }
                          }}
                          disabled={authLoading}
                          className="w-full py-2 bg-slate-900 text-white font-bold rounded-xl transition shadow hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                        >
                          {authLoading ? '認證載入中...' : (isSignUpMode ? '註冊新 UniCoin 帳戶' : '以 Email 安全登入')}
                        </button>
                      </div>

                      {/* Social Authenticators buttons list */}
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await logInWithGoogle();
                            } catch (e: any) {
                              setAuthError(e.message || 'Google 登入失敗');
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-xl font-bold transition shadow-sm hover:bg-slate-50 hover:border-slate-300 active:scale-95 text-slate-700 cursor-pointer text-xs"
                        >
                          <svg className="w-4 h-4 animate-bounce-short" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          使用 Google 帳號登入
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await logInWithFacebook();
                            } catch (e: any) {
                              setAuthError('已在模擬安全沙箱模擬 Facebook 登入！(請使用快速學生通道或 Google 登入體驗！)');
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1877F2] text-white rounded-xl font-bold transition shadow hover:bg-[#166FE5] active:scale-95 cursor-pointer text-xs"
                        >
                          <i className="bi bi-facebook text-sm" />
                          使用 Facebook 帳號登入
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* LOGGED IN USER VIEW & NOTIFICATIONS HUB LIST */
                    <div className="space-y-4">
                      {/* Active student card banner */}
                      <div className="bg-slate-900 text-slate-100 p-4 rounded-3xl space-y-3.5 relative overflow-hidden border border-slate-800 shadow-md">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full -mr-4 -mt-4" />
                        
                        <div className="flex items-start gap-3 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-emerald-400 flex items-center justify-center text-2xl shadow-sm border border-slate-700/40 shrink-0 select-none">
                            {userProfile?.avatarUrl || '🦊'}
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-extrabold text-sm text-slate-100 truncate">
                                {userProfile?.displayName || user.displayName || 'UniCoin 學生用戶'}
                              </p>
                              {user?.providerData?.some((p: any) => p.providerId === 'google.com') && (
                                <span className="text-[7px] bg-indigo-500/30 text-indigo-300 px-1 py-0.2 rounded font-bold scale-95 shrink-0">
                                  Google 登入
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] text-slate-400 font-mono truncate">{userProfile?.email || user.email}</p>
                            
                            {/* Supplementary profile tags */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {userProfile?.phoneNumber ? (
                                <span className="text-[8px] bg-slate-800 text-slate-350 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 font-mono">
                                  📱 {userProfile.phoneNumber}
                                </span>
                              ) : (
                                <span className="text-[8px] bg-amber-500/15 text-amber-300 px-1.5 py-0.5 rounded-md font-mono">
                                  📱 尚未設定手機
                                </span>
                              )}
                              {userProfile?.birthday ? (
                                <span className="text-[8px] bg-slate-800 text-slate-350 px-1.5 py-0.5 rounded-md flex items-center gap-0.5 font-mono">
                                  🎂 {userProfile.birthday}
                                </span>
                              ) : (
                                <span className="text-[8px] bg-slate-800/40 text-slate-400 px-1.5 py-0.5 rounded-md font-mono">
                                  🎂 尚未設定生日
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* UID Preview & Copy Button */}
                        <div className="bg-slate-950 p-2 rounded-2xl flex items-center justify-between text-[8px] text-slate-400 font-mono gap-1 border border-slate-850/60 relative z-10">
                          <span className="truncate">UID: {userProfile?.uid || generate10DigitUid(user.uid)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const finalUid = userProfile?.uid || generate10DigitUid(user.uid);
                              navigator.clipboard.writeText(finalUid);
                              alert('📋 已成功複製您的 UID 至剪貼簿！');
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2 py-0.5 rounded-lg transition text-[7.5px] font-bold cursor-pointer"
                          >
                            複製
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono relative z-10">
                          <span className="flex items-center gap-1 text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            雲端同步中
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={handleStartEditProfile}
                              className="text-[9px] text-indigo-300 hover:text-white font-bold bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded-xl transition duration-150 cursor-pointer border border-indigo-505/20"
                            >
                              ✏️ 編輯個人資料
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await logOut();
                                alert('已登出帳戶，UniCoin 將暫停雲端通知！');
                              }}
                              className="text-[9px] text-rose-400 hover:text-rose-350 font-bold bg-slate-800 px-2.5 py-1 rounded-xl cursor-pointer"
                            >
                              登出
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Editing Profile Subsection with beautiful form blocks */}
                      {isEditingProfile && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs text-slate-750"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <p className="font-extrabold text-slate-800 text-xs flex items-center gap-1">
                              🛡️ 修改雲端個人檔案 (修改後自動同步)
                            </p>
                            <button
                              type="button"
                              onClick={() => setIsEditingProfile(false)}
                              className="text-[9.5px] text-slate-400 hover:text-slate-650 bg-slate-100 hover:bg-slate-200/50 px-2.5 py-0.5 rounded-lg cursor-pointer"
                            >
                              取消
                            </button>
                          </div>

                          {profileSaveFeedback && (
                            <div className={`p-2.5 rounded-xl border text-[10px] ${
                              profileSaveFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                              profileSaveFeedback.type === 'info' ? 'bg-indigo-50 border-indigo-200 text-indigo-800' :
                              'bg-rose-50 border-rose-200 text-rose-800'
                            }`}>
                              {profileSaveFeedback.text}
                            </div>
                          )}

                          <div className="space-y-3 font-sans">
                            {/* UID Read-only */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-extrabold text-slate-400">UID (不可修改，僅供預覽與加入好友搜尋)</label>
                              <input
                                type="text"
                                value={userProfile?.uid || generate10DigitUid(user.uid)}
                                disabled
                                className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl outline-none text-[9.5px] text-slate-500 font-mono cursor-not-allowed"
                              />
                            </div>

                            {/* Avatar Selector Grid */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-extrabold text-slate-400">自訂大頭貼 ({editProfileAvatar})</label>
                              <div className="grid grid-cols-6 gap-1.5 p-2 bg-slate-50 rounded-2xl border border-dashed border-slate-200 max-h-[90px] overflow-y-auto">
                                {['🦊', '🐨', '🐼', '🦁', '🐯', '🐮', '🐷', '🐸', '🐵', '🐣', '🎓', '💻', '🎨', '🎸', '🏀', '🍹', '🍕', '🍜', '🚀', '🛸', '👻', '🔥', '🌸', '🍭'].map(icon => (
                                  <button
                                    key={icon}
                                    type="button"
                                    onClick={() => setEditProfileAvatar(icon)}
                                    className={`h-7 rounded-xl flex items-center justify-center text-sm transition font-sans ${
                                      editProfileAvatar === icon 
                                        ? 'bg-indigo-600 text-white shadow font-bold scale-105' 
                                        : 'bg-white hover:bg-slate-100 border border-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {icon}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Display Name Input */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-extrabold text-slate-400">個人名字 / 科系或暱稱</label>
                              <div className="relative">
                                <User className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                                <input
                                  type="text"
                                  placeholder="例如: 小美 (成大中文)"
                                  value={editProfileName}
                                  onChange={(e) => setEditProfileName(e.target.value)}
                                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border rounded-xl outline-none text-xs text-slate-800 font-bold"
                                />
                              </div>
                            </div>

                            {/* Birthday Input */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-extrabold text-slate-400">生日 Birthday</label>
                              <input
                                type="date"
                                value={editProfileBirthday}
                                onChange={(e) => setEditProfileBirthday(e.target.value)}
                                className="w-full px-2.5 py-1.8 bg-slate-50 border rounded-xl outline-none text-xs text-slate-800 font-mono"
                              />
                            </div>

                            {/* Email Input & Code Simulation */}
                            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-150 space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-[10px] font-extrabold text-slate-550">電子信箱 Email</label>
                                {user?.providerData?.some((p: any) => p.providerId === 'google.com') && (
                                  <span className="text-[7.5px] bg-red-150 text-red-700 px-1.5 py-0.2 rounded font-bold">Google 帳戶，不支援更名信箱</span>
                                )}
                              </div>
                              <div className="flex gap-1.5">
                                <input
                                  type="email"
                                  placeholder="student@example.com"
                                  value={editProfileEmail}
                                  disabled={user?.providerData?.some((p: any) => p.providerId === 'google.com')}
                                  onChange={(e) => {
                                    setEditProfileEmail(e.target.value);
                                    if (e.target.value !== (userProfile?.email || user.email || '')) {
                                      setEmailVerified(false);
                                    } else {
                                      setEmailVerified(true);
                                    }
                                  }}
                                  className={`flex-1 px-2.5 py-1.5 text-xs font-mono border rounded-xl outline-none min-w-0 ${
                                    user?.providerData?.some((p: any) => p.providerId === 'google.com')
                                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' 
                                      : 'bg-white border-slate-200 text-slate-800'
                                  }`}
                                />
                                {!user?.providerData?.some((p: any) => p.providerId === 'google.com') && (
                                  <button
                                    type="button"
                                    onClick={handleSendEmailCode}
                                    disabled={isSendingEmailCode || emailVerified || !editProfileEmail.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-[10px] px-2.5 py-1 rounded-xl transition duration-150 font-bold cursor-pointer shrink-0"
                                  >
                                    {isSendingEmailCode ? '發送中...' : (emailVerified ? '信箱已認證' : '獲取驗證碼')}
                                  </button>
                                )}
                              </div>

                              {!user?.providerData?.some((p: any) => p.providerId === 'google.com') && !emailVerified && sentEmailCode && (
                                <div className="space-y-1 bg-white p-2 rounded-xl border border-slate-100 mt-1">
                                  <p className="text-[8.5px] text-indigo-600 font-extrabold">📬 請輸入信箱中顯示的 4 位認證代碼：</p>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="輸入 4 位驗證碼..."
                                      value={emailVerificationCodeInput}
                                      onChange={(e) => setEmailVerificationCodeInput(e.target.value)}
                                      className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-[10px] text-slate-800"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleVerifyEmailCode}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-3 py-1 rounded-xl transition duration-150 font-bold cursor-pointer"
                                    >
                                      認證
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Phone Input & Code Simulation */}
                            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-150 space-y-2">
                              <label className="text-[10px] font-extrabold text-slate-550">手機號碼 Phone Number</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="例如: 0912345678"
                                  value={editProfilePhone}
                                  onChange={(e) => {
                                    setEditProfilePhone(e.target.value);
                                    if (e.target.value !== (userProfile?.phoneNumber || '')) {
                                      setPhoneVerified(false);
                                    } else {
                                      setPhoneVerified(true);
                                    }
                                  }}
                                  className="flex-1 px-2.5 py-1.5 text-xs font-mono border rounded-xl outline-none text-slate-800 bg-white border-slate-200 min-w-0"
                                />
                                <button
                                  type="button"
                                  onClick={handleSendPhoneSMS}
                                  disabled={isSendingPhoneCode || phoneVerified || !editProfilePhone.trim()}
                                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white disabled:text-slate-400 text-[10px] px-2.5 py-1 rounded-xl transition duration-150 font-bold cursor-pointer shrink-0"
                                >
                                  {isSendingPhoneCode ? '傳送中...' : (phoneVerified ? '手機已認證' : '獲取驗證碼')}
                                </button>
                              </div>

                              {!phoneVerified && sentPhoneCode && (
                                <div className="space-y-1 bg-white p-2 rounded-xl border border-slate-100 mt-1">
                                  <p className="text-[8.5px] text-indigo-600 font-extrabold">📱 請輸入剛才簡訊說明的 4 位認證碼：</p>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="text"
                                      placeholder="輸入 4 位驗證碼..."
                                      value={phoneVerificationCodeInput}
                                      onChange={(e) => setPhoneVerificationCodeInput(e.target.value)}
                                      className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-[10px] text-slate-800"
                                    />
                                    <button
                                      type="button"
                                      onClick={handleVerifyPhoneSMS}
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-3 py-1 rounded-xl transition duration-150 font-bold cursor-pointer"
                                    >
                                      認證
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Save & Cancel buttons */}
                          <div className="flex gap-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={handleSaveProfile}
                              disabled={isSavingProfile}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold rounded-xl transition duration-150 cursor-pointer text-xs shadow-xs"
                            >
                              {isSavingProfile ? '正在同步雲端...' : '儲存更新'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsEditingProfile(false)}
                              disabled={isSavingProfile}
                              className="py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 px-4 rounded-xl transition duration-150 text-xs cursor-pointer"
                            >
                              取消
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Notif block lists */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-bold text-slate-500 flex items-center gap-1">
                            <Bell className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
                            分帳通知與催款明細 ({notifications.filter(n => n.status === 'unread').length} 筆未讀)
                          </p>
                          <button
                            type="button"
                            onClick={async () => {
                              if (user) {
                                setIsNotifLoading(true);
                                const fresh = await fbGetNotifications(user.uid);
                                setNotifications(fresh || []);
                                setIsNotifLoading(false);
                              }
                            }}
                            className="text-[9px] text-indigo-600 font-extrabold hover:underline cursor-pointer"
                          >
                            💧 點此刷新重新同步
                          </button>
                        </div>

                        {isNotifLoading ? (
                          <div className="p-8 text-center text-slate-400 italic">拉取雲端催收通知中...</div>
                        ) : notifications.length === 0 ? (
                          <div className="bg-slate-50 border border-dashed border-slate-200 p-8 rounded-2xl text-center space-y-1">
                            <div className="w-7 h-7 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-1">
                              <Bell className="w-4 h-4 text-indigo-400" />
                            </div>
                            <p className="font-bold text-slate-500">暫無代墊分帳通知</p>
                            <p className="text-[9px] text-slate-400">當其他同學在 UniCoin 發起分帳並填寫您的信箱時，您將收到即時提醒！</p>
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {notifications.map(item => (
                              <div
                                key={item.id}
                                className={`p-3 rounded-2xl border transition relative ${
                                  item.status === 'unread' 
                                    ? 'bg-gradient-to-r from-indigo-50/50 to-indigo-50/10 border-indigo-200' 
                                    : 'bg-white border-slate-200/60 opacity-60'
                                }`}
                              >
                                {item.status === 'unread' && (
                                  <span className="absolute top-3.5 right-3 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                                )}
                                <div className="space-y-1 pr-4">
                                  <p className="font-black text-slate-800 text-[11px] flex items-center gap-1">
                                    {item.title}
                                  </p>
                                  <p className="text-[10px] text-slate-650 leading-relaxed font-sans">{item.message}</p>
                                  <p className="text-[8px] text-slate-400 font-mono">{new Date(item.date).toLocaleDateString()} • 由 {item.senderName} 發出</p>
                                </div>

                                {item.status === 'unread' && (
                                  <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-100">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await fbMarkAsReadNotification(user.uid, item.id, item);
                                          setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, status: 'read' } : n));
                                          alert('🙋 成功確認！已完成此筆分帳點收歸還！');
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }}
                                      className="py-1 px-3 bg-indigo-600 text-white font-bold rounded-lg text-[9px] hover:bg-indigo-700 active:scale-95 transition cursor-pointer"
                                    >
                                      ✓ 朕已付清/朕知道了
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await fbMarkAsReadNotification(user.uid, item.id, item);
                                          setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, status: 'read' } : n));
                                          alert('❌ 已取消/拒絕本筆請求項。');
                                        } catch (err) {
                                          console.error(err);
                                        }
                                      }}
                                      className="py-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold rounded-lg text-[9px] active:scale-95 transition cursor-pointer"
                                    >
                                      ✕ 駁回/取消
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Friends search system */}
                  {user && (
                    <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <p className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                          <Search className="w-4 h-4 text-indigo-500 animate-pulse" />
                          🔍 尋找並加入線上好友 (手機/UID)
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-[10px] text-slate-400">
                          可搜尋好友註冊時設定的<b>手機號碼</b>、<b>UID帳號</b>，或完整的 <b>信箱</b>：
                        </p>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            placeholder="輸入手機、UID 或信箱 Email..."
                            value={friendSearchQuery}
                            onChange={(e) => setFriendSearchQuery(e.target.value)}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSearchFriend();
                              }
                            }}
                            className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-[11px] text-slate-800 font-sans"
                          />
                          <button
                            type="button"
                            onClick={handleSearchFriend}
                            disabled={isSearchingFriend || !friendSearchQuery.trim()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl transition duration-150 cursor-pointer text-[10px] whitespace-nowrap disabled:opacity-50"
                          >
                            {isSearchingFriend ? '搜尋中...' : '搜尋'}
                          </button>
                        </div>
                      </div>

                      {searchError && (
                        <p className="text-[10px] text-rose-500 bg-rose-50 p-2 rounded-xl border border-rose-100">
                          ⚠️ {searchError}
                        </p>
                      )}

                      {/* Search results display */}
                      {friendSearchResult && (
                        <div className="bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100/55 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-[11px] truncate flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                {friendSearchResult.displayName}
                              </p>
                              {friendSearchResult.phoneNumber && (
                                <p className="text-[9px] text-slate-500 mt-0.5">📱 手機號碼: {friendSearchResult.phoneNumber}</p>
                              )}
                              <p className="text-[9px] text-slate-400">UID: {friendSearchResult.uid}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const isExist = friends.some(f => f.id === friendSearchResult.uid || f.email === friendSearchResult.email);
                                if (isExist) {
                                  alert('此用戶已經是您的好友囉！');
                                  return;
                                }
                                const newFriend: FriendItem = {
                                  id: friendSearchResult.uid,
                                  displayName: friendSearchResult.displayName,
                                  email: friendSearchResult.email || '',
                                  phoneNumber: friendSearchResult.phoneNumber || '',
                                  isRealUser: true
                                };
                                setFriends([...friends, newFriend]);
                                setFriendSearchResult(null);
                                setFriendSearchQuery('');
                                alert(`🎉 成功將「${friendSearchResult.displayName}」加為雲端同步好友！`);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-xl transition duration-150 shrink-0 cursor-pointer"
                            >
                              + 加入好友
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Friends list management system */}
                  <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <p className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <Users className="w-4 h-4 text-indigo-500" />
                        👥 我的精選好友列表
                      </p>
                      <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                        共 {friends.length} 位
                      </span>
                    </div>

                    {/* Add Friend Row form */}
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="輸入新的自訂好友姓名..."
                        value={newFriendName}
                        onChange={(e) => setNewFriendName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newFriendName.trim()) {
                              const trimmed = newFriendName.trim();
                              if (friends.some(f => f.displayName === trimmed)) {
                                alert('已存在此好友姓名囉！');
                              } else {
                                setFriends([...friends, { id: `local-${Date.now()}`, displayName: trimmed }]);
                                setNewFriendName('');
                              }
                            }
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-[11px] text-slate-800 font-sans"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newFriendName.trim()) {
                            const trimmed = newFriendName.trim();
                            if (friends.some(f => f.displayName === trimmed)) {
                              alert('已存在此好友姓名囉！');
                            } else {
                              setFriends([...friends, { id: `local-${Date.now()}`, displayName: trimmed }]);
                              setNewFriendName('');
                            }
                          } else {
                            alert('請填寫好友姓名！');
                          }
                        }}
                        className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-3 py-1.5 rounded-xl transition duration-150 cursor-pointer text-[10px] whitespace-nowrap"
                      >
                        + 新增
                      </button>
                    </div>

                    {/* List of Friends */}
                    {friends.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic text-center py-4">目前好友名單為空，請手動新增！</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-0.5">
                        {friends.map((friend) => {
                          const avatarChar = friend.displayName.substring(0, 1);
                          return (
                            <div
                              key={friend.id}
                              className="flex items-center justify-between p-2 bg-slate-50 rounded-2xl border border-slate-100 transition-all hover:bg-indigo-50/20"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-750 flex items-center justify-center font-bold text-[9px] shrink-0">
                                  {avatarChar}
                                </div>
                                <div className="min-w-0 leading-tight">
                                  <p className="font-bold text-slate-700 text-[11px] truncate">
                                    {friend.displayName}
                                  </p>
                                  {friend.isRealUser && (
                                    <span className="text-[7px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-bold inline-block shrink-0 scale-90 -translate-x-1">
                                      已同步
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setFriends(friends.filter((f) => f.id !== friend.id));
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded transition shrink-0 cursor-pointer"
                                title="刪除好友"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <p className="text-[9px] text-slate-400 leading-normal bg-orange-50/60 p-2 rounded-xl border border-orange-100/40">
                      💡 <b>好友小知識</b>：線上好友是透過搜尋對方<b>電話號碼/UID</b>查出的實際註冊用戶，加好友後即可在群組分帳各付各的，一秒點選！
                    </p>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

          {/* Smartphone iOS-like Bottom Navigation bar anchor tabs */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 p-2.5 flex justify-around items-center rounded-b-[32px] z-30 select-none">
            <button
              id="btn-nav-home"
              onClick={() => setActiveScreen('home')}
              className={`flex flex-col items-center gap-1 flex-1 py-1 transition ${
                activeScreen === 'home' ? themeStyles.tabActive : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Coins className="w-4 h-4" />
              <span className="text-[9px] font-bold whitespace-nowrap">手動記帳</span>
            </button>
            <button
              id="btn-nav-split"
              onClick={() => setActiveScreen('aa-split')}
              className={`flex flex-col items-center gap-1 flex-1 py-1 transition ${
                activeScreen === 'aa-split' ? themeStyles.tabActive : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Users className="w-4 h-4" />
              <span className="text-[9px] font-bold whitespace-nowrap">群組分帳</span>
            </button>
            <button
              id="btn-nav-invoice"
              onClick={() => setActiveScreen('invoice')}
              className={`flex flex-col items-center gap-1 flex-1 py-1 transition ${
                activeScreen === 'invoice' ? themeStyles.tabActive : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span className="text-[9px] font-bold whitespace-nowrap">發票載具</span>
            </button>
            <button
              id="btn-nav-chart"
              onClick={() => setActiveScreen('chart')}
              className={`flex flex-col items-center gap-1 flex-1 py-1 transition ${
                activeScreen === 'chart' ? themeStyles.tabActive : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <ChartIcon className="w-4 h-4" />
              <span className="text-[9px] font-bold whitespace-nowrap">預算分析</span>
            </button>
            <button
              id="btn-nav-account"
              onClick={() => setActiveScreen('account')}
              className={`flex flex-col items-center gap-1 flex-1 py-1 transition ${
                activeScreen === 'account' ? themeStyles.tabActive : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <User className="w-4 h-4" />
                {notifications.some(n => n.status === 'unread') && (
                  <span className="absolute -top-1 -right-1 block w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                )}
              </div>
              <span className="text-[9px] font-bold whitespace-nowrap">個人</span>
            </button>
          </div>

          {/* HILARIOUS AA COUPLING催墊款 MEME OVERLAY (Should Have P1 LINE Sharing simulation) */}
          <AnimatePresence>
            {activeMemeCard?.show && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-xs"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white rounded-3xl p-5 w-full max-w-[290px] space-y-4 shadow-2xl border border-slate-100"
                >
                  <div className="flex items-center gap-2 pb-2.5 border-b">
                    <span className="p-1 px-2.5 bg-rose-100 text-rose-600 rounded-full font-bold text-[9px]">
                      {activeMemeCard.memeType === 'aggressive' ? '暴躁催帳卡' : '土坑同理催帳卡'}
                    </span>
                    <span className="text-[10px] text-slate-400">已自動生成趣味卡</span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-2xl border border-dashed text-justify">
                    {activeMemeCard.text}
                  </p>

                  <div className="bg-slate-100 p-2.5 rounded-xl text-[10px] text-slate-500 leading-relaxed text-center">
                    📲 可點擊下方綠色鍵 <b>「一鍵模擬分享至 LINE」</b>，化解催債尷尬！
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        alert("已成功複製催款笑話文字至剪貼簿！可以至賴群組貼上催款。");
                        setActiveMemeCard(null);
                      }}
                      className="flex-1 py-2 bg-slate-900 text-white rounded-xl font-bold font-mono transition text-xs flex justify-center items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> 複製文字
                    </button>
                    <button
                      onClick={() => {
                        window.alert(`【UniCoin LINE催款模擬分享】\n已將催款趣味文案與卡片圖片導向至 LINE 催款分享模組！`);
                        setActiveMemeCard(null);
                      }}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-bold font-mono hover:bg-emerald-700 transition text-xs flex justify-center items-center gap-1.5"
                    >
                      <Share2 className="w-3.5 h-3.5" /> LINE分享
                    </button>
                  </div>

                  <button
                    onClick={() => setActiveMemeCard(null)}
                    className="w-full py-1 text-center text-slate-400 hover:text-slate-600 text-[11px]"
                  >
                    關閉卡片
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* EDIT TRANSACTION OVERLAY MODAL */}
          <AnimatePresence>
            {editingTransaction && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-xs"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white rounded-3xl p-5 w-full max-w-[290px] space-y-4 shadow-2xl border border-indigo-100"
                >
                  <div className="flex items-center gap-1.5 pb-2 border-b">
                    <Pencil className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-extrabold text-slate-800">修改學生記帳紀錄</h3>
                  </div>

                  <div className="space-y-3.5 text-left">
                    {/* Amount input */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        記帳金額 ($)
                      </label>
                      <input
                        type="number"
                        placeholder="請輸入金額"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono font-bold text-slate-850 text-xs"
                      />
                    </div>

                    {/* Note input */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        消費備註 / 名稱
                      </label>
                      <input
                        type="text"
                        placeholder="請輸入備註 (如：香滷肉飯)"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-800 text-xs font-semibold"
                      />
                    </div>

                    {/* Category selectors */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1.5">
                        選擇消費類別
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['學餐/宵夜', '書籍教材', '學雜費', '房租水電', '社團系隊', '社交娛樂', '交通費', '其他'] as CategoryType[]).map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setEditCategory(cat)}
                            className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition ${
                              editCategory === cat
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setEditingTransaction(null)}
                      className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl font-bold transition text-xs"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="flex-1 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold transition text-xs shadow-md"
                    >
                      保存修改
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* PRIZE DRAW INTERACTIVE SUCCESS OVERLAY (Should Have P1) */}
          <AnimatePresence>
            {prizeOverlay?.show && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-xs"
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  className="bg-white rounded-3xl p-5 w-full max-w-[290px] space-y-4 shadow-2xl border border-rose-100 text-center"
                >
                  <div className="w-14 h-14 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto animate-bounce mb-1">
                    <Sparkles className="w-8 h-8" />
                  </div>

                  <h3 className="text-base font-black text-rose-600">加菜金入帳了！！！</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">六獎中獎：$200 元</p>

                  <p className="text-xs text-slate-700 leading-relaxed bg-rose-50/70 p-3.5 rounded-2xl text-justify border border-rose-100">
                    {prizeOverlay.message}
                  </p>

                  <button
                    onClick={() => {
                      // Add 200 allowance or simulate income bonus in user transactions list to update current total
                      const syncedCategory: CategoryType = '其他';
                      const newTx: Transaction = {
                        id: Date.now().toString(),
                        amount: -200, // Negative expense equals income!
                        category: syncedCategory,
                        note: '💰 [發票中獎] 加菜金提撥',
                        date: new Date().toISOString(),
                        isInvoiceSynced: true
                      };
                      setTransactions([newTx, ...transactions]);
                      setPrizeOverlay(null);
                      alert("發票中獎補助款 +$200 元已全數注入活水！本月賸餘生活費已向上攀升。");
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition text-xs"
                  >
                    領取中獎加菜金 (+$200) 🥳
                  </button>

                  <button
                    onClick={() => setPrizeOverlay(null)}
                    className="w-full text-slate-400 hover:text-slate-600 text-[10px]"
                  >
                    謝啦，先不用
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
      
      {/* Interactive toggle controllers below frame */}
      <div className="mt-3 flex gap-2 justify-center max-w-[375px] w-full bg-[#1e2538] p-2.5 rounded-xl border border-slate-700/60 shadow-md">
        <button
          onClick={() => {
            // Force simulated expense to trigger dirt-eating mode (total expense becomes limit + 500)
            const targetAmount = Math.max(0, monthlyLimit - totalExpenses + 250);
            const newTx: Transaction = {
              id: Date.now().toString(),
              amount: targetAmount,
              category: '學餐/宵夜',
              note: '強制爆產大會餐 🍖',
              date: new Date().toISOString(),
              isInvoiceSynced: false
            };
            setTransactions([newTx, ...transactions]);
          }}
          className="flex-1 py-1.5 px-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 rounded-lg text-[10px] font-semibold border border-rose-500/20 active:scale-95 transition text-center"
        >
          💥 模擬一鍵花光 (觸發吃土模式)
        </button>
        <button
          onClick={() => {
            // Restore budget back to safety
            setTransactions(transactions.filter(t => t.note !== '強制爆產大會餐 🍖' && t.amount < 1000));
          }}
          className="flex-1 py-1.5 px-2 bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 rounded-lg text-[10px] font-semibold border border-emerald-500/20 active:scale-95 transition text-center"
        >
          🌱 模擬補血重新做人 (重設正常)
        </button>
      </div>
    </div>
  );
}
