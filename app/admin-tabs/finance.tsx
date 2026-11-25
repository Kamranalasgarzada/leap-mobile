import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/services/api';
import { useAppColors } from '../../src/hooks/useAppColors';
import { spacing, borderRadius } from '../../src/theme';
import { Card } from '../../src/components/Card';
import { LoadingScreen } from '../../src/components/LoadingScreen';

const MONTHS_AZ = ['Yanvar','Fevral','Mart','Aprel','May','İyun','İyul','Avqust','Sentyabr','Oktyabr','Noyabr','Dekabr'];

const INCOME_CATEGORIES = ['Kurs ödənişi','İcarə gəliri','Sponsor','Qrant','Digər gəlir'];
const EXPENSE_CATEGORIES = ['İcarə','Kommunal','Reklam','Avadanlıq','Maaş','SMM','Digər'];

type TabKey = 'summary' | 'income' | 'expenses' | 'templates';

export default function FinanceScreen() {
  const { t } = useTranslation();
  const c = useAppColors();
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [incomeData, setIncomeData] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  // form state
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<'income'|'expense'|'template'>('income');
  const [editId, setEditId] = useState<string|null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formTemplateType, setFormTemplateType] = useState<'INCOME'|'EXPENSE'>('INCOME');

  const loadData = useCallback(async (forceAll = false) => {
    setLoading(true);
    try {
      if (forceAll || activeTab === 'summary') {
        const res = await api.adminGetFinanceSummary(month, year);
        setSummary(res);
      }
      if (forceAll || activeTab === 'income') {
        const res = await api.adminGetIncomeList(month, year);
        setIncomeData(res);
      }
      if (forceAll || activeTab === 'expenses') {
        const res = await api.adminGetExpenseList(month, year);
        setExpenses(res?.expenses ?? []);
      }
      if (forceAll || activeTab === 'templates') {
        const res = await api.adminGetTemplates();
        setTemplates(res?.templates ?? []);
      }
    } catch {} finally { setLoading(false); }
  }, [activeTab, month, year]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const changeMonth = (dir: number) => {
    let m = month + dir;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  };

  const resetForm = () => {
    setShowForm(false); setEditId(null);
    setFormTitle(''); setFormDesc(''); setFormAmount(''); setFormCategory('');
  };

  const openAddForm = (type: 'income'|'expense'|'template') => {
    resetForm(); setFormType(type); setShowForm(true);
  };

  const openEditForm = (item: any, type: 'income'|'expense'|'template') => {
    setFormType(type); setEditId(item?.id); setFormTitle(item?.title ?? '');
    setFormDesc(item?.description ?? ''); setFormAmount(String(item?.amount ?? ''));
    setFormCategory(item?.category ?? '');
    if (type === 'template') setFormTemplateType(item?.type === 'EXPENSE' ? 'EXPENSE' : 'INCOME');
    setShowForm(true);
  };

  const saveForm = async () => {
    if (!formTitle?.trim() || !formAmount?.trim()) return;
    const data: any = { title: formTitle, description: formDesc || undefined, amount: parseFloat(formAmount), category: formCategory || (formType === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]) };
    try {
      if (formType === 'income') {
        if (editId) await api.adminUpdateIncome(editId, data);
        else await api.adminCreateIncome(data);
      } else if (formType === 'expense') {
        if (editId) await api.adminUpdateExpense(editId, data);
        else await api.adminCreateExpense(data);
      } else {
        data.type = formTemplateType;
        if (editId) await api.adminUpdateTemplate(editId, data);
        else await api.adminCreateTemplate(data);
      }
      resetForm(); loadData(true);
    } catch { Alert.alert(t('common.error'), t('common.tryAgain')); }
  };

  const deleteItem = async (id: string, type: 'income'|'expense'|'template') => {
    const doDelete = async () => {
      try {
        if (type === 'income') await api.adminDeleteIncome(id);
        else if (type === 'expense') await api.adminDeleteExpense(id);
        else await api.adminDeleteTemplate(id);
        loadData(true);
      } catch {}
    };
    if (Platform.OS === 'web') { if (confirm(t('common.confirmDelete'))) doDelete(); }
    else Alert.alert(t('common.confirmDelete'), '', [{ text: t('common.cancel') }, { text: t('common.delete'), style: 'destructive', onPress: doDelete }]);
  };

  const applyTemplate = async (id: string) => {
    try {
      await api.adminApplyTemplate(id);
      Alert.alert(t('finance.templateApplied'));
      loadData(true);
    } catch { Alert.alert(t('common.error')); }
  };

  const allTabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'summary', label: t('finance.report'), icon: 'chart-bar' },
    { key: 'income', label: t('finance.income'), icon: 'cash-plus' },
    { key: 'expenses', label: t('finance.expenses'), icon: 'cash-minus' },
    { key: 'templates', label: t('finance.templates'), icon: 'file-document-outline' },
  ];
  // Hide templates — it's only for the website, not the mobile app
  const tabs = allTabs.filter(t2 => t2.key !== 'templates');

  const formatMoney = (v: number | undefined) => `${(v ?? 0).toFixed(0)} AZN`;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      {/* Tabs */}
      <ScrollView showsVerticalScrollIndicator={false} horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {tabs.map(tab => (
          <Pressable key={tab.key} onPress={() => { setActiveTab(tab.key); }} style={[styles.tab, activeTab === tab.key && { backgroundColor: c.primary + '20', borderColor: c.primary }]}>
            <MaterialCommunityIcons name={tab.icon as any} size={18} color={activeTab === tab.key ? c.primary : c.textMuted} />
            <Text style={[styles.tabText, { color: activeTab === tab.key ? c.primary : c.textMuted }]}>{tab.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Month selector (not for templates) */}
      {activeTab !== 'templates' && (
        <View style={[styles.monthSelector, { borderBottomColor: c.cardBorder }]}>
          <Pressable onPress={() => changeMonth(-1)}><MaterialCommunityIcons name="chevron-left" size={28} color={c.textHeading} /></Pressable>
          <Text style={[styles.monthText, { color: c.textHeading }]}>{MONTHS_AZ[month]} {year}</Text>
          <Pressable onPress={() => changeMonth(1)}><MaterialCommunityIcons name="chevron-right" size={28} color={c.textHeading} /></Pressable>
        </View>
      )}

      {loading ? <LoadingScreen /> : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
          {/* ═══ SUMMARY TAB ═══ */}
          {activeTab === 'summary' && summary && (
            <View style={styles.content}>
              <View style={styles.summaryGrid}>
                <Card style={styles.summaryCard}>
                  <View style={[styles.summaryIconBox, { backgroundColor: '#10B981' + '20' }]}>
                    <MaterialCommunityIcons name="arrow-down-circle" size={24} color="#10B981" />
                  </View>
                  <Text style={[styles.summaryValue, { color: '#10B981' }]}>{formatMoney(summary?.totalIncome)}</Text>
                  <Text style={[styles.summaryLabel, { color: c.textMuted }]}>{t('finance.totalIncome')}</Text>
                </Card>
                <Card style={styles.summaryCard}>
                  <View style={[styles.summaryIconBox, { backgroundColor: '#EF4444' + '20' }]}>
                    <MaterialCommunityIcons name="arrow-up-circle" size={24} color="#EF4444" />
                  </View>
                  <Text style={[styles.summaryValue, { color: '#EF4444' }]}>{formatMoney(summary?.totalExpense)}</Text>
                  <Text style={[styles.summaryLabel, { color: c.textMuted }]}>{t('finance.totalExpense')}</Text>
                </Card>
                <Card style={styles.summaryCard}>
                  <View style={[styles.summaryIconBox, { backgroundColor: '#F59E0B' + '20' }]}>
                    <MaterialCommunityIcons name="account-tie" size={24} color="#F59E0B" />
                  </View>
                  <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>{formatMoney(summary?.teacherShare)}</Text>
                  <Text style={[styles.summaryLabel, { color: c.textMuted }]}>{t('finance.teacherShare')}</Text>
                </Card>
                <Card style={styles.summaryCard}>
                  <View style={[styles.summaryIconBox, { backgroundColor: c.primary + '20' }]}>
                    <MaterialCommunityIcons name="chart-line" size={24} color={c.primary} />
                  </View>
                  <Text style={[styles.summaryValue, { color: (summary?.netProfit ?? 0) >= 0 ? '#10B981' : '#EF4444' }]}>{formatMoney(summary?.netProfit)}</Text>
                  <Text style={[styles.summaryLabel, { color: c.textMuted }]}>{t('finance.netProfit')}</Text>
                </Card>
              </View>
              {/* Breakdown */}
              <Card style={{ marginTop: spacing.md }}>
                <Text style={[styles.breakdownTitle, { color: c.textHeading }]}>{t('finance.breakdown')}</Text>
                <View style={styles.breakdownRow}>
                  <Text style={{ color: c.textBody, flex: 1 }}>{t('finance.paymentIncome')}</Text>
                  <Text style={{ color: '#10B981', fontWeight: '600' }}>{formatMoney(summary?.paymentIncome)}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={{ color: c.textBody, flex: 1 }}>{t('finance.manualIncome')}</Text>
                  <Text style={{ color: '#10B981', fontWeight: '600' }}>{formatMoney(summary?.manualIncome)}</Text>
                </View>
              </Card>
            </View>
          )}

          {/* ═══ INCOME TAB ═══ */}
          {activeTab === 'income' && (
            <View style={styles.content}>
              <Pressable style={[styles.addBtn, { backgroundColor: c.primary }]} onPress={() => openAddForm('income')}>
                <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                <Text style={styles.addBtnText}>{t('finance.addIncome')}</Text>
              </Pressable>

              {/* Manual incomes */}
              {(incomeData?.manualIncomes?.length ?? 0) > 0 && (
                <Text style={[styles.subHeading, { color: c.textHeading }]}>{t('finance.manualIncome')}</Text>
              )}
              {(incomeData?.manualIncomes ?? []).map((item: any) => (
                <Card key={item?.id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: c.textHeading }]}>{item?.title ?? ''}</Text>
                      <Text style={[styles.itemMeta, { color: c.textMuted }]}>{item?.category ?? ''} • {new Date(item?.date).toLocaleDateString('az')}</Text>
                      {item?.description ? <Text style={[styles.itemDesc, { color: c.textBody }]}>{item.description}</Text> : null}
                    </View>
                    <Text style={[styles.itemAmount, { color: '#10B981' }]}>+{formatMoney(item?.amount)}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable onPress={() => openEditForm(item, 'income')} style={styles.actionBtn}>
                      <MaterialCommunityIcons name="pencil" size={16} color={c.primary} />
                    </Pressable>
                    <Pressable onPress={() => deleteItem(item?.id, 'income')} style={styles.actionBtn}>
                      <MaterialCommunityIcons name="delete" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </Card>
              ))}

              {/* Payment incomes */}
              {(incomeData?.paymentIncomes?.length ?? 0) > 0 && (
                <Text style={[styles.subHeading, { color: c.textHeading }]}>{t('finance.paymentIncome')}</Text>
              )}
              {(incomeData?.paymentIncomes ?? []).map((item: any) => (
                <Card key={item?.id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: c.textHeading }]}>{item?.studentName ?? ''}</Text>
                      <Text style={[styles.itemMeta, { color: c.textMuted }]}>{t('finance.coursePayment')} • {new Date(item?.date).toLocaleDateString('az')}</Text>
                    </View>
                    <Text style={[styles.itemAmount, { color: '#10B981' }]}>+{formatMoney(item?.amount)}</Text>
                  </View>
                </Card>
              ))}

              {(incomeData?.manualIncomes?.length ?? 0) === 0 && (incomeData?.paymentIncomes?.length ?? 0) === 0 && (
                <Text style={[styles.emptyText, { color: c.textMuted }]}>{t('finance.noRecords')}</Text>
              )}
            </View>
          )}

          {/* ═══ EXPENSES TAB ═══ */}
          {activeTab === 'expenses' && (
            <View style={styles.content}>
              <Pressable style={[styles.addBtn, { backgroundColor: '#EF4444' }]} onPress={() => openAddForm('expense')}>
                <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                <Text style={styles.addBtnText}>{t('finance.addExpense')}</Text>
              </Pressable>
              {(expenses ?? []).map((item: any) => (
                <Card key={item?.id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: c.textHeading }]}>{item?.title ?? ''}</Text>
                      <Text style={[styles.itemMeta, { color: c.textMuted }]}>{item?.category ?? ''} • {new Date(item?.date).toLocaleDateString('az')}</Text>
                      {item?.description ? <Text style={[styles.itemDesc, { color: c.textBody }]}>{item.description}</Text> : null}
                    </View>
                    <Text style={[styles.itemAmount, { color: '#EF4444' }]}>-{formatMoney(item?.amount)}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable onPress={() => openEditForm(item, 'expense')} style={styles.actionBtn}>
                      <MaterialCommunityIcons name="pencil" size={16} color={c.primary} />
                    </Pressable>
                    <Pressable onPress={() => deleteItem(item?.id, 'expense')} style={styles.actionBtn}>
                      <MaterialCommunityIcons name="delete" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </Card>
              ))}
              {(expenses?.length ?? 0) === 0 && (
                <Text style={[styles.emptyText, { color: c.textMuted }]}>{t('finance.noRecords')}</Text>
              )}
            </View>
          )}

          {/* ═══ TEMPLATES TAB ═══ */}
          {activeTab === 'templates' && (
            <View style={styles.content}>
              <Pressable style={[styles.addBtn, { backgroundColor: c.primary }]} onPress={() => openAddForm('template')}>
                <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
                <Text style={styles.addBtnText}>{t('finance.addTemplate')}</Text>
              </Pressable>

              {/* Income templates */}
              {(templates ?? []).filter((t: any) => t?.type === 'INCOME').length > 0 && (
                <Text style={[styles.subHeading, { color: c.textHeading }]}>{t('finance.incomeTemplates')}</Text>
              )}
              {(templates ?? []).filter((tmpl: any) => tmpl?.type === 'INCOME').map((tmpl: any) => (
                <Card key={tmpl?.id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: c.textHeading }]}>{tmpl?.title ?? ''}</Text>
                      <Text style={[styles.itemMeta, { color: c.textMuted }]}>{tmpl?.category ?? ''}</Text>
                    </View>
                    <Text style={[styles.itemAmount, { color: '#10B981' }]}>{formatMoney(tmpl?.amount)}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable onPress={() => applyTemplate(tmpl?.id)} style={[styles.applyBtn, { backgroundColor: '#10B981' + '20' }]}>
                      <MaterialCommunityIcons name="check" size={14} color="#10B981" />
                      <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '600' }}>{t('finance.apply')}</Text>
                    </Pressable>
                    <Pressable onPress={() => openEditForm(tmpl, 'template')} style={styles.actionBtn}>
                      <MaterialCommunityIcons name="pencil" size={16} color={c.primary} />
                    </Pressable>
                    <Pressable onPress={() => deleteItem(tmpl?.id, 'template')} style={styles.actionBtn}>
                      <MaterialCommunityIcons name="delete" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </Card>
              ))}

              {/* Expense templates */}
              {(templates ?? []).filter((t: any) => t?.type === 'EXPENSE').length > 0 && (
                <Text style={[styles.subHeading, { color: c.textHeading }]}>{t('finance.expenseTemplates')}</Text>
              )}
              {(templates ?? []).filter((tmpl: any) => tmpl?.type === 'EXPENSE').map((tmpl: any) => (
                <Card key={tmpl?.id} style={{ marginBottom: spacing.sm }}>
                  <View style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, { color: c.textHeading }]}>{tmpl?.title ?? ''}</Text>
                      <Text style={[styles.itemMeta, { color: c.textMuted }]}>{tmpl?.category ?? ''}</Text>
                    </View>
                    <Text style={[styles.itemAmount, { color: '#EF4444' }]}>{formatMoney(tmpl?.amount)}</Text>
                  </View>
                  <View style={styles.actionRow}>
                    <Pressable onPress={() => applyTemplate(tmpl?.id)} style={[styles.applyBtn, { backgroundColor: '#EF4444' + '20' }]}>
                      <MaterialCommunityIcons name="check" size={14} color="#EF4444" />
                      <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>{t('finance.apply')}</Text>
                    </Pressable>
                    <Pressable onPress={() => openEditForm(tmpl, 'template')} style={styles.actionBtn}>
                      <MaterialCommunityIcons name="pencil" size={16} color={c.primary} />
                    </Pressable>
                    <Pressable onPress={() => deleteItem(tmpl?.id, 'template')} style={styles.actionBtn}>
                      <MaterialCommunityIcons name="delete" size={16} color="#EF4444" />
                    </Pressable>
                  </View>
                </Card>
              ))}

              {(templates?.length ?? 0) === 0 && (
                <Text style={[styles.emptyText, { color: c.textMuted }]}>{t('finance.noRecords')}</Text>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* ═══ ADD/EDIT MODAL ═══ */}
      {showForm && (
        <View style={[styles.modalOverlay]}>
          <Pressable style={styles.modalBackdrop} onPress={resetForm} />
          <View style={[styles.modalContent, { backgroundColor: c.surface, borderColor: c.cardBorder }]}>
            <Text style={[styles.modalTitle, { color: c.textHeading }]}>
              {editId ? t('common.edit') : t('common.add')} — {formType === 'income' ? t('finance.income') : formType === 'expense' ? t('finance.expenses') : t('finance.templates')}
            </Text>

            <TextInput placeholder={t('finance.titlePlaceholder')} value={formTitle} onChangeText={setFormTitle}
              style={[styles.input, { color: c.textBody, borderColor: c.cardBorder, backgroundColor: c.background }]} placeholderTextColor={c.textMuted} />
            <TextInput placeholder={t('finance.descPlaceholder')} value={formDesc} onChangeText={setFormDesc}
              style={[styles.input, { color: c.textBody, borderColor: c.cardBorder, backgroundColor: c.background }]} placeholderTextColor={c.textMuted} />
            <TextInput placeholder={t('finance.amountPlaceholder')} value={formAmount} onChangeText={setFormAmount}
              keyboardType="numeric"
              style={[styles.input, { color: c.textBody, borderColor: c.cardBorder, backgroundColor: c.background }]} placeholderTextColor={c.textMuted} />

            {/* Category selector */}
            <Text style={[styles.formLabel, { color: c.textMuted }]}>{t('finance.category')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
              {(formType === 'income' || (formType === 'template' && formTemplateType === 'INCOME') ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                <Pressable key={cat} onPress={() => setFormCategory(cat)}
                  style={[styles.catChip, { backgroundColor: formCategory === cat ? c.primary : c.background, borderColor: formCategory === cat ? c.primary : c.cardBorder }]}>
                  <Text style={{ color: formCategory === cat ? '#FFF' : c.textBody, fontSize: 12 }}>{cat}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Template type toggle */}
            {formType === 'template' && (
              <View style={styles.typeToggle}>
                <Pressable onPress={() => { setFormTemplateType('INCOME'); setFormCategory(''); }}
                  style={[styles.typeBtn, formTemplateType === 'INCOME' && { backgroundColor: '#10B981' + '20', borderColor: '#10B981' }]}>
                  <Text style={{ color: formTemplateType === 'INCOME' ? '#10B981' : c.textMuted, fontWeight: '600', fontSize: 13 }}>{t('finance.income')}</Text>
                </Pressable>
                <Pressable onPress={() => { setFormTemplateType('EXPENSE'); setFormCategory(''); }}
                  style={[styles.typeBtn, formTemplateType === 'EXPENSE' && { backgroundColor: '#EF4444' + '20', borderColor: '#EF4444' }]}>
                  <Text style={{ color: formTemplateType === 'EXPENSE' ? '#EF4444' : c.textMuted, fontWeight: '600', fontSize: 13 }}>{t('finance.expenses')}</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.modalActions}>
              <Pressable onPress={resetForm} style={[styles.modalBtn, { backgroundColor: c.background }]}>
                <Text style={{ color: c.textBody }}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable onPress={saveForm} style={[styles.modalBtn, { backgroundColor: c.primary }]}>
                <Text style={{ color: '#FFF', fontWeight: '600' }}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: { maxHeight: 52 },
  tabBarContent: { paddingHorizontal: spacing.md, gap: spacing.xs, alignItems: 'center', paddingVertical: spacing.xs },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: borderRadius.full, borderWidth: 1, borderColor: 'transparent' },
  tabText: { fontSize: 13, fontWeight: '600' },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, gap: spacing.lg },
  monthText: { fontSize: 16, fontWeight: '600', minWidth: 130, textAlign: 'center' },
  content: { padding: spacing.lg },
  // Summary
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryCard: { width: '47%', alignItems: 'center', paddingVertical: spacing.md },
  summaryIconBox: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  summaryLabel: { fontSize: 11, marginTop: 2 },
  breakdownTitle: { fontSize: 16, fontWeight: '600', marginBottom: spacing.sm },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.05)' },
  // Items
  subHeading: { fontSize: 16, fontWeight: '600', marginTop: spacing.md, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start' },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  itemMeta: { fontSize: 12, marginTop: 2 },
  itemDesc: { fontSize: 12, marginTop: 4 },
  itemAmount: { fontSize: 16, fontWeight: '700' },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.xs },
  actionBtn: { padding: 6 },
  applyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: borderRadius.md, marginBottom: spacing.md },
  addBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  emptyText: { textAlign: 'center', marginTop: 40, fontSize: 14 },
  // Modal
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', maxWidth: 420, borderRadius: borderRadius.lg, padding: spacing.lg, borderWidth: 1, zIndex: 101 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.md },
  input: { borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, marginBottom: spacing.sm },
  formLabel: { fontSize: 12, marginBottom: 4 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full, borderWidth: 1, marginRight: 6 },
  typeToggle: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  typeBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: borderRadius.md, borderWidth: 1, borderColor: 'transparent' },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  modalBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: borderRadius.md },
});
