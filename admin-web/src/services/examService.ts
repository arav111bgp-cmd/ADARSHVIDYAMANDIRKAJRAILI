import type { Exam } from '../types';
import { apiFetch } from './api';
import { notificationService } from './notificationService';
import { dataConfig } from './dataConfig';
import { createDocument, queryDocuments } from './firebaseService';
import { academicService } from './academicService';

export const examService = {
  async getExams(): Promise<Exam[]> {
    if (dataConfig.isFirebase()) {
      try {
        const firestoreExams = await queryDocuments<any>('exams');
        if (firestoreExams && firestoreExams.length > 0) {
          return firestoreExams.map((e: any) => ({
            id: e.id,
            name: e.name || e.examName || e.shortName,
            startDate: e.startDate || '2026-09-15',
            endDate: e.endDate || '2026-09-25',
            classes: e.classes || (e.className ? [e.className] : ['Class 5-A']),
            status: e.status === 'Completed' ? 'completed' : e.status === 'Ongoing' ? 'ongoing' : 'upcoming',
            isAdmitCardPublished: e.isAdmitCardPublished ?? true
          }));
        }
      } catch (e) {
        console.warn('[FIREBASE] examService.getExams error:', e);
      }
    }

    try {
      const res = await apiFetch<any>('/api/exams');
      if (res.success && res.data) {
        return res.data;
      }
    } catch (e) {
      console.warn('examService.getExams fallback:', e);
    }

    const academicExams = academicService.getExams();
    return academicExams.map((e: any) => ({
      id: e.id,
      name: e.name || e.examName || e.shortName,
      startDate: e.startDate || '2026-09-15',
      endDate: e.endDate || '2026-09-25',
      classes: e.classes || ['Class 5-A'],
      status: e.status === 'Completed' ? 'completed' : 'upcoming',
      isAdmitCardPublished: true
    }));
  },

  async createExam(examData: Omit<Exam, 'id' | 'isAdmitCardPublished'>): Promise<{ success: boolean; exam: Exam }> {
    try {
      notificationService.notifyExamCreated(
        examData.name,
        examData.classes && examData.classes.length > 0 ? examData.classes : ['Class 5']
      );
    } catch (e) {}

    const id = `EX-${Date.now().toString().slice(-4)}`;
    const newExam: Exam = {
      ...examData,
      id,
      isAdmitCardPublished: true
    };

    if (dataConfig.isFirebase()) {
      try {
        await createDocument('exams', {
          ...newExam,
          examName: examData.name,
          shortName: examData.name,
          status: examData.status === 'completed' ? 'Completed' : 'Scheduled',
          academicSessionId: '2026-27',
          createdAt: new Date().toISOString()
        }, id);
      } catch (e) {
        console.error('[FIREBASE] examService.createExam error:', e);
      }
    }

    // Also register in academicService
    try {
      academicService.addExam({
        name: examData.name,
        shortName: examData.name,
        startDate: examData.startDate,
        endDate: examData.endDate,
        classes: examData.classes || ['Class 5-A'],
        status: examData.status === 'completed' ? 'Completed' : 'Scheduled',
        academicSessionId: '2026-27'
      });
    } catch (e) {}

    return {
      success: true,
      exam: newExam
    };
  }
};
