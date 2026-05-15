import React from 'react';
import { X, MessageSquare, Send } from 'lucide-react';
import { styles, brandNavy } from '../../Reguler/components/dashboardStyles';

export default function ModalPesanDirektur({ msgModal, msgText, setMsgText, handleSendMessage, isSending, onClose }) {
    if (!msgModal) return null;

    return (
        <div style={styles.modalOverlay}>
            <form onSubmit={handleSendMessage} style={{ background: 'white', padding: '30px', borderRadius: '15px', width: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={20}/> Kirim Instruksi</h3>
                    <button type="button" onClick={onClose} style={styles.closeBtn}><X size={20}/></button>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                    <label style={styles.lb}>Kepada:</label>
                    <div style={{ background: '#f1f5f9', padding: '10px 15px', borderRadius: '8px', fontWeight: 800, color: '#1e293b' }}>{msgModal.nama_lengkap}</div>
                </div>

                <div style={{ marginBottom: '25px' }}>
                    <label style={styles.lb}>Isi Pesan / Teguran:</label>
                    <textarea required rows="4" value={msgText} onChange={(e) => setMsgText(e.target.value)} style={{ ...styles.inp, resize: 'vertical' }} placeholder="Ketik instruksi di sini..."></textarea>
                </div>

                <button type="submit" disabled={isSending} style={styles.btnPrimary}>
                    {isSending ? 'Mengirim...' : <><Send size={18}/> Kirim Sekarang</>}
                </button>
            </form>
        </div>
    );
}