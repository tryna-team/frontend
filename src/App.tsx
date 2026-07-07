import './App.css';
import QuickModal from '@/features/event/components/QuickModal';

function App() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-6">
      <QuickModal
        message="이 이벤트를 삭제하시겠습니까?"
        onConfirm={() => alert('삭제 확인')}
        onClose={() => alert('모달 닫힘')}
      />
    </div>
  );
}

export default App;
