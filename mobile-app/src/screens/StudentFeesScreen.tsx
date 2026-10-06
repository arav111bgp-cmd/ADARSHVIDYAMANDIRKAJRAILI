import React, { useState, useEffect } from 'react';
import { Student, StudentFeeDetails, FeePayment } from '../types';
import { studentService } from '../services/studentService';
import { feeService } from '../services/feeService';
import { demoDataStore } from '../services/demoDataStore';
import { classService } from '../services/classService';
import { ReceiptModal } from '../components/ReceiptModal';
import { Receipt } from 'lucide-react';
import { Modal } from '../components/Modal';

interface StudentFeesScreenProps {
  student: Student;
}

export const StudentFeesScreen: React.FC<StudentFeesScreenProps> = ({ student }) => {
  const [feeDetails, setFeeDetails] = useState<StudentFeeDetails>({
    studentId: student.id,
    totalFee: 30000,
    paidFee: 0,
    pendingFee: 30000,
    dueDate: '2026-10-10',
    categories: [
      { name: 'Admission Fee', amount: 5000, paid: false },
      { name: 'Tuition Fee (Q1 & Q2)', amount: 15000, paid: false },
      { name: 'Examination Fee', amount: 2000, paid: false },
      { name: 'Transport Fee (Q2)', amount: 5000, paid: false }
    ],
    history: []
  });
  const [selectedReceipt, setSelectedReceipt] = useState<FeePayment | null>(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payAmount, setPayAmount] = useState('10000');

  const fetchFeeDetails = async () => {
    try {
      const data = await feeService.getFeeDetails(student.id || 'STU-101');
      if (data) {
        setFeeDetails(data);
      } else {
        const fallback = await studentService.getFeeDetails(student.id);
        setFeeDetails(fallback);
      }
    } catch (e) {
      console.warn('Error fetching fee details:', e);
    }
  };

  useEffect(() => {
    fetchFeeDetails();
    const unsubscribe = demoDataStore.subscribe(() => {
      fetchFeeDetails();
    });
    return () => unsubscribe();
  }, [student.id]);

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    const amt = parseFloat(payAmount) || 10000;
    await feeService.payFeeOnline(student.id, amt);
    setPaying(false);
    setPayModalOpen(false);
    await fetchFeeDetails();
  };

  return (
    <div style={{ padding: '16px 16px 80px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: '#172033' }}>Fee Details</h2>
        <p style={{ fontSize: 12, color: '#667085' }}>{classService.formatClassDisplay(student.className, student.section)} Fee Breakdown & Receipts</p>
      </div>

      {/* Main Fee Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div className="avm-card" style={{ padding: 12, textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Total Fee</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#172033', marginTop: 2 }}>
            ₹{feeDetails.totalFee.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="avm-card" style={{ padding: 12, textAlign: 'center', borderTop: '3px solid #16A34A' }}>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Paid Fee</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#16A34A', marginTop: 2 }}>
            ₹{feeDetails.paidFee.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="avm-card" style={{ padding: 12, textAlign: 'center', borderTop: '3px solid #EF4444' }}>
          <div style={{ fontSize: 11, color: '#667085', fontWeight: 600 }}>Pending Fee</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#EF4444', marginTop: 2 }}>
            ₹{(feeDetails.pendingFee !== undefined ? feeDetails.pendingFee : (feeDetails.dueFee || 0)).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Pay Fee Action Box if Pending */}
      {(feeDetails.pendingFee !== undefined ? feeDetails.pendingFee : (feeDetails.dueFee || 0)) > 0 && (
        <div style={{
          backgroundColor: '#FFF7ED',
          border: '1px solid #FFEDD5',
          borderRadius: 16,
          padding: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#C2410C' }}>
              Pending Fee Due: ₹{(feeDetails.pendingFee !== undefined ? feeDetails.pendingFee : (feeDetails.dueFee || 0)).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 11, color: '#EA580C', marginTop: 2 }}>
              Due Date: {feeDetails.dueDate || '2026-10-10'}
            </div>
          </div>

          <button
            className="avm-btn-primary"
            onClick={() => setPayModalOpen(true)}
            style={{ backgroundColor: '#EA580C', padding: '10px 16px', fontSize: 13 }}
          >
            Pay Now
          </button>
        </div>
      )}

      {/* Fee Breakdown Categories */}
      <div className="avm-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#172033', marginBottom: 12 }}>
          Fee Category Split
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(feeDetails.categories || [
            { name: 'Tuition Fee (Annual)', amount: feeDetails.totalFee, paid: (feeDetails.dueFee || 0) === 0 }
          ]).map((cat, idx) => (
            <div key={idx} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 0',
              borderBottom: idx < (feeDetails.categories || []).length - 1 ? '1px solid #F1F5F9' : 'none'
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#172033' }}>{cat.name}</div>
                <div style={{ fontSize: 11, color: '#667085' }}>₹{cat.amount.toLocaleString('en-IN')}</div>
              </div>

              <span style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 9px',
                borderRadius: 12,
                backgroundColor: cat.paid ? '#EAF8EF' : '#FEF2F2',
                color: cat.paid ? '#16A34A' : '#EF4444'
              }}>
                {cat.paid ? 'Paid' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="avm-card" style={{ padding: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#172033', marginBottom: 12 }}>
          Payment History & Receipts
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(!feeDetails.history || feeDetails.history.length === 0) && (!feeDetails.receipts || feeDetails.receipts.length === 0) ? (
            <div style={{ fontSize: 12, color: '#667085', textAlign: 'center' }}>No fee payment history found.</div>
          ) : (
            (feeDetails.history || (feeDetails.receipts || []).map((r) => ({
              receiptNo: r.receiptNo,
              date: r.date,
              amount: r.amount,
              paymentMode: r.mode || 'Online UPI',
              status: 'Paid',
              description: 'Fee Payment'
            }))).map((pmt, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#F8FAFC',
                borderRadius: 12,
                padding: 12,
                border: '1px solid #E2E8F0'
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#172033' }}>{pmt.description}</div>
                  <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>
                    {pmt.date} • {pmt.paymentMode} • {pmt.receiptNo}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#16A34A' }}>
                    ₹{pmt.amount.toLocaleString('en-IN')}
                  </div>
                  <button
                    onClick={() => setSelectedReceipt(pmt)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#1769E0',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginTop: 4,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3
                    }}
                  >
                    <Receipt size={12} /> Receipt
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {selectedReceipt && (
        <ReceiptModal
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          student={student}
          payment={selectedReceipt}
        />
      )}

      {/* Payment Simulator Modal */}
      {payModalOpen && (
        <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title="Online Fee Payment">
          <form onSubmit={handlePaySubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                Select Payment Amount
              </label>
              <input
                type="number"
                className="avm-input"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
            </div>

            <div style={{
              backgroundColor: '#F1F5F9',
              padding: 12,
              borderRadius: 10,
              fontSize: 12,
              marginBottom: 16,
              color: '#334155'
            }}>
              <strong>Payment Gateway Simulator:</strong>
              <div>• Select UPI / Netbanking / Debit Card</div>
              <div>• Instantly issues verified receipt</div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="avm-btn-secondary" style={{ flex: 1 }} onClick={() => setPayModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="avm-btn-primary" style={{ flex: 1 }} disabled={paying}>
                {paying ? 'Processing...' : 'Pay ₹' + payAmount}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
