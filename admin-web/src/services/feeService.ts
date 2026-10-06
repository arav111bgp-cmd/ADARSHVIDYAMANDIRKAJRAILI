import type { StudentFeeDetails } from '../types';
import { demoDataStore, SchoolFeeRecord, SchoolFeeStructureItem, SchoolFeePaymentHistory } from './demoDataStore';
import { notificationService } from './notificationService';
import { firebaseService } from './firebaseService';
import { dataConfig } from './dataConfig';

export const feeService = {
  getAllFeeRecords(sessionId: string = '2026-27'): SchoolFeeRecord[] {
    if (dataConfig.isFirebase()) {
      // Async sync from Firestore in background
      firebaseService.queryDocuments<SchoolFeeRecord>('fees').then(firestoreList => {
        if (firestoreList && firestoreList.length > 0) {
          const db = demoDataStore.getDB();
          db.fees = firestoreList;
          demoDataStore.saveDB(db);
        }
      }).catch(() => {});
    }

    const db = demoDataStore.getDB();
    const fees: SchoolFeeRecord[] = db.fees || [];
    return fees.filter(f => !f.academicSessionId || f.academicSessionId === sessionId);
  },

  getFeeRecordByStudentId(studentId: string, sessionId: string = '2026-27'): SchoolFeeRecord | undefined {
    const records = this.getAllFeeRecords(sessionId);
    return records.find(f => f.studentId === studentId || f.id === studentId);
  },

  async getStudentFeeDetails(studentId: string): Promise<StudentFeeDetails> {
    return this.getFeeDetails(studentId);
  },

  async getFeeDetails(studentId: string): Promise<StudentFeeDetails> {
    const rec = this.getFeeRecordByStudentId(studentId);
    if (!rec) {
      return {
        studentId,
        totalFee: 0,
        paidFee: 0,
        pendingFee: 0,
        dueFee: 0,
        dueDate: '2026-10-10',
        categories: [],
        history: [],
        receipts: []
      };
    }

    return {
      studentId: rec.studentId,
      totalFee: rec.totalFee,
      paidFee: rec.paidFee,
      pendingFee: rec.pendingFee,
      dueFee: rec.pendingFee,
      dueDate: rec.dueDate || '2026-10-10',
      categories: (rec.feeStructure || []).map(f => ({
        name: f.name,
        amount: f.amount,
        paid: f.status === 'PAID'
      })),
      history: (rec.paymentHistory || []).map(h => ({
        receiptNo: h.receiptNo,
        date: h.date,
        amount: h.amount,
        paymentMode: h.paymentMode,
        collectedBy: h.collectedBy,
        status: h.status,
        description: h.description || `${h.paymentMode} Fee Payment`
      })),
      receipts: (rec.paymentHistory || []).map(h => ({
        receiptNo: h.receiptNo,
        date: h.date,
        amount: h.amount,
        mode: h.paymentMode,
        title: h.description || `${h.paymentMode} Fee Payment`
      }))
    };
  },

  saveFeeRecord(record: SchoolFeeRecord): SchoolFeeRecord {
    const db = demoDataStore.getDB();
    if (!db.fees) db.fees = [];

    const index = db.fees.findIndex(f => f.id === record.id || (f.studentId === record.studentId && f.academicSessionId === record.academicSessionId));

    record.pendingFee = Math.max(0, record.totalFee - record.paidFee);
    record.status = record.paidFee >= record.totalFee ? 'PAID' : (record.paidFee > 0 ? 'PARTIAL' : 'PENDING');
    record.updatedAt = new Date().toISOString();

    if (dataConfig.isFirebase()) {
      const feeId = record.id || `FEE-${record.studentId}`;
      record.id = feeId;
      firebaseService.createDocument('fees', feeId, { ...record, schoolId: 'AVM' }).catch(err => {
        console.error('[feeService] Firestore save error:', err);
      });
    }

    if (index !== -1) {
      db.fees[index] = record;
    } else {
      db.fees.unshift(record);
    }

    demoDataStore.saveDB(db);
    try {
      notificationService.notifyFeeUpdated(
        record.studentId,
        record.studentName || 'Student',
        record.className || 'Class 5',
        record.pendingFee
      );
    } catch (e) {}
    return record;
  },

  updateFee(record: SchoolFeeRecord): SchoolFeeRecord {
    return this.saveFeeRecord(record);
  },

  addOrUpdateFeeItem(params: {
    studentId: string;
    studentName?: string;
    admissionNo?: string;
    className?: string;
    section?: string;
    itemName?: string;
    amount: number;
    dueDate?: string;
    sessionId?: string;
    academicSessionId?: string;
    feeType?: string;
    remarks?: string;
  }): { success: boolean; record: SchoolFeeRecord } {
    const sessionId = params.sessionId || params.academicSessionId || '2026-27';
    const itemName = params.itemName || params.feeType || 'Fee Item';
    let record = this.getFeeRecordByStudentId(params.studentId, sessionId);

    if (!record) {
      record = {
        id: `FEE-${params.studentId}-${sessionId}`,
        studentId: params.studentId,
        studentName: params.studentName || 'Student',
        admissionNo: params.admissionNo || params.studentId,
        className: params.className || 'Class 5-A',
        section: params.section || 'A',
        academicSessionId: sessionId,
        totalFee: 0,
        paidFee: 0,
        pendingFee: 0,
        status: 'PENDING',
        dueDate: params.dueDate || '2026-10-10',
        feeStructure: [],
        paymentHistory: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    const existingItem = record.feeStructure.find(f => f.name.toLowerCase() === itemName.toLowerCase());
    if (existingItem) {
      record.totalFee += (params.amount - existingItem.amount);
      existingItem.amount = params.amount;
    } else {
      record.feeStructure.push({
        id: `FEE-ITEM-${Date.now()}`,
        name: itemName,
        amount: params.amount,
        dueDate: params.dueDate || '2026-10-10',
        paidAmount: 0,
        pendingAmount: params.amount,
        status: 'PENDING'
      });
      record.totalFee += params.amount;
    }

    const saved = this.saveFeeRecord(record);
    return { success: true, record: saved };
  },

  setupRegistrationFeeRecord(params: {
    studentId: string;
    studentName: string;
    admissionNo: string;
    className: string;
    section?: string;
    rollNo?: number | string;
    totalFee?: number;
    sessionId?: string;
    academicSessionId?: string;
    tuitionFee?: number;
    admissionFee?: number;
    otherFee?: number;
    transportFee?: number;
    hostelFee?: number;
    examFee?: number;
    initialPayment?: number;
    paymentMode?: string;
    paymentDate?: string;
  }): SchoolFeeRecord {
    const sessionId = params.sessionId || params.academicSessionId || '2026-27';
    const totalFee = params.totalFee || (params.tuitionFee ? (params.tuitionFee + (params.admissionFee || 0) + (params.otherFee || 0) + (params.transportFee || 0)) : 15000);
    const record: SchoolFeeRecord = {
      id: `FEE-${params.studentId}-${sessionId}`,
      studentId: params.studentId,
      studentName: params.studentName,
      admissionNo: params.admissionNo,
      className: params.className,
      section: params.section || 'A',
      rollNo: typeof params.rollNo === 'number' ? params.rollNo : undefined,
      academicSessionId: sessionId,
      totalFee,
      paidFee: params.initialPayment || 0,
      pendingFee: Math.max(0, totalFee - (params.initialPayment || 0)),
      status: (params.initialPayment || 0) >= totalFee ? 'PAID' : (params.initialPayment || 0) > 0 ? 'PARTIAL' : 'PENDING',
      dueDate: '2026-10-10',
      feeStructure: [
        { id: 'ITEM-TUI', name: 'Tuition Fee', amount: params.tuitionFee || totalFee * 0.7, dueDate: '2026-10-10', paidAmount: 0, pendingAmount: params.tuitionFee || totalFee * 0.7, status: 'PENDING' },
        { id: 'ITEM-ADM', name: 'Admission & Admin Fee', amount: params.admissionFee || totalFee * 0.3, dueDate: '2026-10-10', paidAmount: 0, pendingAmount: params.admissionFee || totalFee * 0.3, status: 'PENDING' }
      ],
      paymentHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return this.saveFeeRecord(record);
  },

  recordPayment(params: {
    studentId: string;
    amount: number;
    paymentMode?: 'Cash' | 'Bank Transfer' | 'Cheque' | 'Online' | 'UPI' | string;
    collectedBy?: string;
    remarks?: string;
    sessionId?: string;
    academicSessionId?: string;
    feeType?: string;
    paymentDate?: string;
    transactionRef?: string;
  }): { success: boolean; record: SchoolFeeRecord; receiptNo: string; error?: string } {
    const sessionId = params.sessionId || '2026-27';
    let record = this.getFeeRecordByStudentId(params.studentId, sessionId);
    const receiptNo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    if (record) {
      record.paidFee += params.amount;
      record.paymentHistory = record.paymentHistory || [];
      const paymentEntry: SchoolFeePaymentHistory = {
        id: `PAY-${Date.now()}`,
        receiptNo,
        date: params.paymentDate || new Date().toISOString().split('T')[0],
        amount: params.amount,
        paymentMode: (params.paymentMode as any) || 'Cash',
        collectedBy: params.collectedBy || 'Admin Office',
        status: 'PAID',
        description: params.remarks || 'Fee Payment'
      };
      record.paymentHistory.unshift(paymentEntry);

      if (dataConfig.isFirebase()) {
        firebaseService.createDocument('feePayments', paymentEntry.id, {
          ...paymentEntry,
          studentId: params.studentId,
          schoolId: 'AVM'
        }).catch(() => {});
      }

      const saved = this.saveFeeRecord(record);
      return { success: true, record: saved, receiptNo };
    }

    return {
      success: false,
      record: {
        id: `FEE-${params.studentId}`,
        studentId: params.studentId,
        studentName: 'Student',
        admissionNo: params.studentId,
        className: 'Class 5',
        section: 'A',
        academicSessionId: sessionId,
        totalFee: params.amount,
        paidFee: params.amount,
        pendingFee: 0,
        status: 'PAID',
        feeStructure: [],
        paymentHistory: []
      },
      receiptNo,
      error: `Fee record for student ${params.studentId} not found.`
    };
  },

  async payFeeOnline(studentId: string, amount: number): Promise<{ success: boolean; receiptNo: string }> {
    const res = this.recordPayment({
      studentId,
      amount,
      paymentMode: 'Online',
      collectedBy: 'Self / Online Gateway',
      remarks: 'Online Tuition & Academic Fee Payment'
    });
    return { success: true, receiptNo: res.receiptNo };
  }
};
