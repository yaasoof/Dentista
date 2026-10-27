import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Plus, Minus, Trash2, PhoneCall, Sparkles, Package } from 'lucide-react';
import Papa from 'papaparse';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQHCxB1yvW5YUgltnFvXAW31Rs50AGiGMBzsbK41vs6I8oX_v3iLiD7uUMKwA3PYJQp3Jg3PIpV7lI_/pub?gid=0&single=true&output=csv";
const WHATSAPP_NUMBER = "201101522440"; // رقم الواتساب المخصص للطلبات
const SHIPPING_FEE = 100; // رسوم الشحن الثابتة

export default function App() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [monthlyVolume, setMonthlyVolume] = useState(5000);
  // جلب الأسعار الأصلية تماماً من عمود price في الشيت بدون أي زيادات
  const fetchProductsFromCSV = async () => {
    setLoading(true);
    try {
      const response = await fetch(CSV_URL);
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const loadedProducts = results.data
            .map((row, index) => {
              const name = String(row.name || row.title || '').trim();
              const rawPrice = String(row.price || '0').replace(/[^0-9.]/g, '');
              const category = String(row.category || 'عام').trim();

              if (name || rawPrice) {
                const exactPrice = parseFloat(rawPrice) || 0;
                return {
                  id: String(index + 1),
                  name: name,
                  category: category,
                  price: exactPrice,
                };
              }
              return null;
            })
            .filter((item) => item !== null);

          setProducts(loadedProducts);
          setFilteredProducts(loadedProducts);
          setLoading(false);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
          setLoading(false);
        },
      });
    } catch (error) {
      console.error('Error fetching CSV:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsFromCSV();
  }, []);

  // التصفية والبحث
  useEffect(() => {
    const result = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
    setFilteredProducts(result);
  }, [searchTerm, selectedCategory, products]);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const volumeDiscountRate = monthlyVolume > 20000 ? 0.15 : monthlyVolume > 10000 ? 0.10 : monthlyVolume > 5000 ? 0.05 : 0;
  const discountAmount = subtotal * volumeDiscountRate;
  const total = subtotal - discountAmount + (cart.length > 0 ? SHIPPING_FEE : 0);

  // إرسال الطلب عبر الواتساب مع تضمين رسوم الشحن
  const checkoutWhatsApp = () => {
    if (cart.length === 0) return;
    let message = `مرحباً، أرغب في طلب المنتجات التالية من متجر Dentista:\n\n`;
    cart.forEach((item, idx) => {
      message += `${idx + 1}. ${item.name} - الكمية: ${item.qty} - السعر: $${(item.price * item.qty).toFixed(2)}\n`;
    });
    message += `\nالمجموع الفرعي: $${subtotal.toFixed(2)}`;
    if (discountAmount > 0) {
      message += `\nالخصم الحجمي (${volumeDiscountRate * 100}%): -$${discountAmount.toFixed(2)}`;
    }
    message += `\nرسوم الشحن الثابتة: $${SHIPPING_FEE.toFixed(2)}`;
    message += `\nالإجمالي النهائي: $${total.toFixed(2)}`;
    
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 rtl" dir="rtl">
      {/* شريط الإعلانات العلوي */}
      <div className="bg-teal-700 text-white text-xs py-2 px-4 text-center flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
        <span>عروض خاصة لعيادات الأسنان والمراكز الطبية • توصيل سريع ومضمون</span>
      </div>

      {/* الرأس */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md shadow-sm border-b border-teal-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-teal-600 rounded-xl flex items-center justify-center shadow-md shadow-teal-600/20 text-white font-black text-2xl">
              D
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-teal-900">Dentista</h1>
              <p className="text-xs text-teal-600 font-medium">مستلزمات طب الأسنان الاحترافية</p>
            </div>
          </div>

          <div className="flex items-center gap-3 ">
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative bg-teal-50 hover:bg-teal-100 text-teal-800 px-4 py-2.5 rounded-xl transition flex items-center gap-2 border border-teal-200 font-bold"
            >
              <ShoppingCart className="w-5 h-5 text-teal-700 " />
              <span className="hidden sm:inline">سلة المشتريات</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                  {cart.reduce((a, c) => a + c.qty, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* قسم البطل */}
      <section className="bg-gradient-to-b from-teal-900 via-teal-800 to-teal-900 text-white py-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <span className="bg-pink-500/20 border border-pink-400/30 text-pink-300 px-4 py-1.5 rounded-full text-xs font-bold uppercase inline-block mb-4">
           Dentista platform
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
           اطلب ماتريال عياداتك من افضل البراند العالمية
          </h2>
          
          
          <div className="bg-white p-2 rounded-2xl shadow-xl max-w-xl mx-auto flex items-center border border-teal-100">
            <Search className="w-5 h-5 text-slate-400 mx-2" />
            <input 
              type="text" 
              placeholder="ابحث عن مواد الحشو، أدوات الجراحة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none px-2 text-sm sm:text-base"
            />
          </div>
        </div>
      </section>

      {/* المنتجات */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h3 className="text-2xl font-bold text-slate-900">قائمة المنتجات والمستلزمات</h3>

          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat 
                    ? 'bg-teal-700 text-white shadow' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-teal-800 font-bold">جاري تحميل المنتجات من جدول البيانات...</p>
          </div>
        )}

        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-semibold">لا توجد منتجات مطابقة لبحثك</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div 
                  key={product.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-teal-50 text-teal-800 text-xs px-2.5 py-1 rounded-lg font-semibold border border-teal-100">
                        {product.category}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base mb-4 leading-relaxed break-words whitespace-normal">
                      {product.name}
                    </h4>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">السعر </span>
                      <span className="text-xl font-extrabold text-teal-700">{product.price.toFixed(2)}</span>
                    </div>
                    
                    <button
                      onClick={() => addToCart(product)}
                      className="bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white px-4 py-2 rounded-xl transition duration-200 font-bold text-sm flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> إضافة
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* سلة المشتريات الجانبية */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          ></div>

          <div className="absolute inset-y-0 left-0 max-w-full flex">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
              
              <div className="p-6 bg-teal-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-pink-300" />
                  <h3 className="font-bold text-lg">سلة المستلزمات ({cart.reduce((a, c) => a + c.qty, 0)})</h3>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="text-teal-200 hover:text-white font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">سلة المشتريات فارغة</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex-1">
                        <h4 className="font-bold text-slate-900 text-sm mb-1 leading-relaxed break-words whitespace-normal">{item.name}</h4>
                        <span className="text-xs text-teal-700 font-semibold">${item.price.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                          <button onClick={() => updateQty(item.id, -1)} className="p-1 text-slate-600 hover:bg-slate-100 rounded-r-lg">
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-3 text-sm font-bold">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="p-1 text-slate-600 hover:bg-slate-100 rounded-l-lg">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button onClick={() => removeFromCart(item.id)} className="text-pink-500 hover:text-pink-700 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-3">
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>المجموع الفرعي:</span>
                    <span className="font-bold">${subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-sm text-slate-600">
                    <span>رسوم الشحن الثابتة:</span>
                    <span className="font-bold">${SHIPPING_FEE.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-lg font-black text-slate-900 pt-2 border-t border-slate-200">
                    <span>الإجمالي النهائي:</span>
                    <span className="text-teal-700">${total.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={checkoutWhatsApp}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <PhoneCall className="w-5 h-5" />
                    إرسال الطلب عبر واتساب
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}