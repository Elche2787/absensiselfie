import React, { useState, useRef, useCallback } from 'react';
import { Camera, Clock, User, School, CheckCircle, AlertCircle, Upload, MapPin } from 'lucide-react';
import AnalogClock from './components/AnalogClock';

interface AttendanceData {
  nama: string;
  kelas: string;
  presensi: string;
  waktuMasuk: string;
  lokasi?: string;
  foto?: string;
}

function App() {
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isOnTime, setIsOnTime] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lokasi, setLokasi] = useState<string>('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const kelasOptions = [
    'X IPA 1', 'X IPA 2', 'X IPA 3',
    'X IPS 1', 'X IPS 2',
    'XI IPA 1', 'XI IPA 2', 'XI IPA 3',
    'XI IPS 1', 'XI IPS 2',
    'XII IPA 1', 'XII IPA 2', 'XII IPA 3',
    'XII IPS 1', 'XII IPS 2'
  ];

  const getCurrentTimeWIB = () => {
    // Use device local time
    return new Date();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const checkIfOnTime = () => {
    const currentTime = getCurrentTimeWIB();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    // Check if before 07:00 (device time)
    const isEarly = currentHour < 7 || (currentHour === 7 && currentMinute === 0);
    return isEarly;
  };

  const getCurrentLocation = useCallback(async () => {
    setIsGettingLocation(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Use reverse geocoding to get address (using a free service)
      try {
        const response = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=id`
        );
        const data = await response.json();
        const address = data.locality || data.city || data.principalSubdivision || 'Lokasi tidak diketahui';
        setLokasi(`${address} (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`);
      } catch (geocodeError) {
        console.error('Error getting address:', geocodeError);
        alert('Tidak dapat mengambil nama lokasi, hanya koordinat yang akan ditampilkan.');
        setLokasi(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLokasi('Lokasi tidak dapat diakses');
      alert('Tidak dapat mengakses lokasi. Pastikan izin lokasi telah diberikan.');
    } finally {
      setIsGettingLocation(false);
    }
  }, []);
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setIsCapturing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.');
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      
      if (context) {
        context.drawImage(videoRef.current, 0, 0);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataURL);
        
        // Stop camera
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setIsCapturing(false);

        // Check time and set feedback
        const onTime = checkIfOnTime();
        setIsOnTime(onTime);
        
        if (onTime) {
          setFeedbackMessage('🎉 Selamat kamu sudah datang tepat waktu!');
        } else {
          setFeedbackMessage('⏰ Kamu terlambat, bangun lebih pagi dan disiplin waktu ya!');
        }
      }
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  }, []);

  const handlePresensi = () => {
    if (!nama.trim() || !kelas.trim()) {
      alert('Mohon lengkapi nama dan kelas terlebih dahulu!');
      return;
    }
    getCurrentLocation();
    startCamera();
  };

  const submitAttendance = async () => {
    if (!capturedPhoto) return;

    setIsSubmitting(true);

    const currentTime = getCurrentTimeWIB();
    const attendanceData: AttendanceData = {
      nama: nama.trim(),
      kelas: kelas,
      presensi: isOnTime ? 'Hadir tepat waktu' : 'Terlambat',
      waktuMasuk: formatTime(currentTime),
      lokasi: lokasi,
      foto: capturedPhoto
    };

    try {
      // Note: In a real application, you would send this data to your backend
      // which would then update the Google Sheet via the Google Sheets API
      console.log('Data kehadiran:', attendanceData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsSubmitted(true);
      setTimeout(() => {
        // Reset form
        setNama('');
        setKelas('');
        setLokasi('');
        setCapturedPhoto(null);
        setFeedbackMessage('');
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert('Gagal menyimpan data kehadiran. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md w-full">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Berhasil!</h2>
          <p className="text-gray-600 mb-4">Data kehadiran telah tersimpan</p>
          <div className="animate-pulse text-blue-600">
            Kembali ke form dalam beberapa detik...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
            <School className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-800 mb-1">SMAN 3 Muara Teweh</h1>
            <p className="text-gray-600">Sistem Kehadiran Siswa</p>
          </div>
          
          <div className="bg-blue-600 text-white p-3 rounded-xl shadow-md">
            <Clock className="w-5 h-5 inline-block mr-2" />
            <span className="font-medium">
              {formatTime(getCurrentTimeWIB())}
            </span>
          </div>
        </div>

        {!capturedPhoto ? (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
            <div className="space-y-6">
              {/* Form Input */}
              <div>
                <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline-block mr-1" />
                  Nama Siswa
                </label>
                <input
                  type="text"
                  id="nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Masukkan nama lengkap"
                  required
                />
              </div>

              <div>
                <label htmlFor="kelas" className="block text-sm font-medium text-gray-700 mb-2">
                  <School className="w-4 h-4 inline-block mr-1" />
                  Kelas
                </label>
                <select
                  id="kelas"
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                >
                  <option value="">Pilih Kelas</option>
                  {kelasOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              {/* Camera Section */}
              {isCapturing ? (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-gray-900">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 object-cover"
                    />
                    <div className="absolute inset-0 border-4 border-blue-500 rounded-xl pointer-events-none"></div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={capturePhoto}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95"
                    >
                      <Camera className="w-5 h-5 inline-block mr-2" />
                      Ambil Foto
                    </button>
                    <button
                      onClick={stopCamera}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handlePresensi}
                  disabled={!nama.trim() || !kelas.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                >
                  <Camera className="w-6 h-6 inline-block mr-2" />
                  HADIR - Ambil Selfie
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Preview and Submit */
          <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
            <div className="text-center">
              <img
                src={capturedPhoto}
                alt="Selfie"
                className="w-48 h-48 object-cover rounded-xl mx-auto border-4 border-blue-500 mb-4"
              />
              
              <div className={`p-4 rounded-xl mb-4 ${
                isOnTime 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                {isOnTime ? (
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                ) : (
                  <AlertCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                )}
                <p className={`font-semibold ${
                  isOnTime ? 'text-green-800' : 'text-orange-800'
                }`}>
                  {feedbackMessage}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl text-left space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Nama:</span>
                  <span className="text-gray-900">{nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Kelas:</span>
                  <span className="text-gray-900">{kelas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`font-semibold ${
                    isOnTime ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {isOnTime ? 'Tepat Waktu' : 'Terlambat'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Waktu:</span>
                  <span className="text-gray-900">{formatTime(getCurrentTimeWIB())}</span>
                </div>
                {lokasi && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-700">Lokasi:</span>
                    <span className="text-gray-900 text-sm">{lokasi}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <button
                  onClick={submitAttendance}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Menyimpan...
                    </div>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 inline-block mr-2" />
                      Simpan Kehadiran
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setCapturedPhoto(null);
                    setFeedbackMessage('');
                    setLokasi('');
                  }}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                  disabled={isSubmitting}
                >
                  Ambil Ulang Foto
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 text-center text-sm text-gray-600 bg-white p-4 rounded-xl shadow-md">
          <p className="mb-2">⏰ <strong>Batas waktu:</strong> 07:00</p>
          <p className="mb-2">📸 Pastikan wajah terlihat jelas dalam foto selfie</p>
          <p className="flex items-center justify-center">
            <MapPin className="w-4 h-4 mr-1" />
            Lokasi akan terdeteksi otomatis saat presensi
          </p>
          {isGettingLocation && (
            <div className="mt-2 flex items-center justify-center text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
              Mendeteksi lokasi...
            </div>
          )}
        </div>

        {/* Credit */}
        <div className="mt-4 text-center text-xs text-gray-500 bg-white p-3 rounded-xl shadow-sm">
          <p>Dibuat oleh <span className="font-semibold text-blue-600">Hafidz Yanuardi</span></p>
        </div>
      </div>
    </div>
  );
}

export default App;