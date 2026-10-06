import React from 'react';
import { Modal } from './Modal';
import { Student, FeePayment } from '../types';
import { mockSchoolInfo } from '../mock/mockData';
import { classService } from '../services/classService';
import { Printer, CheckCircle } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  payment: FeePayment;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  student,
  payment
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Fee Payment Receipt" maxWidth="540px">
      <div className="printable-document">
        <div style={{
          border: '1px solid #CBD5E1',
          borderRadius: 14,
          padding: 20,
          backgroundColor: '#FFFFFF'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '2px solid #1769E0',
            paddingBottom: 12,
            marginBottom: 16
          }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#1769E0', margin: 0 }}>
                {mockSchoolInfo.name}
              </h3>
              <p style={{ fontSize: 10, color: '#667085' }}>{mockSchoolInfo.location}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#172033' }}>
                RECEIPT NO: {payment.receiptNo}
              </div>
              <div style={{ fontSize: 10, color: '#667085' }}>Date: {payment.date}</div>
            </div>
          </div>

          {/* Student Info */}
          <div style={{
            backgroundColor: '#F6F8FC',
            padding: 12,
            borderRadius: 8,
            fontSize: 12,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 16
          }}>
            <div><strong>Student Name:</strong> {student.name}</div>
            <div><strong>Admission No:</strong> {student.admissionNo}</div>
            <div><strong>Class & Sec:</strong> {classService.formatClassDisplay(student.className, student.section)}</div>
            <div><strong>Roll No:</strong> {student.rollNo}</div>
          </div>

          {/* Payment Detail */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
            <thead>
              <tr style={{ backgroundColor: '#F1F5F9' }}>
                <th style={{ padding: 8, textAlign: 'left' }}>Description</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Mode</th>
                <th style={{ padding: 8, textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: 8, borderBottom: '1px solid #E2E8F0' }}>{payment.description}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #E2E8F0' }}>{payment.paymentMode}</td>
                <td style={{ padding: 8, borderBottom: '1px solid #E2E8F0', textAlign: 'right', fontWeight: 700, color: '#16A34A' }}>
                  ₹{payment.amount.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Total Paid Badge */}
          <div style={{
            backgroundColor: '#EAF8EF',
            border: '1px solid #BBF7D0',
            borderRadius: 10,
            padding: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#16A34A',
            marginBottom: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
              <CheckCircle size={18} /> Payment Received
            </div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              ₹{payment.amount.toLocaleString('en-IN')}
            </div>
          </div>

          <div style={{ textAlign: 'right', fontSize: 10, color: '#667085', marginTop: 12 }}>
            Computer Generated Receipt • Authorized Stamp
          </div>
        </div>
      </div>

      <div className="no-print" style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
        <button className="avm-btn-secondary" onClick={onClose}>
          Close
        </button>
        <button className="avm-btn-primary" onClick={handlePrint}>
          <Printer size={16} /> Print Receipt
        </button>
      </div>
    </Modal>
  );
};
