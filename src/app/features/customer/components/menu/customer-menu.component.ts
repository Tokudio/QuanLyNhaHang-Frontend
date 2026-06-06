// src/app/features/customer/menu/customer-menu.component.ts

import { Component, OnInit, inject, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common'; // THÊM isPlatformBrowser
import { CustomerService } from '../../services/customer.service';
import { MonAn, CartItem, OrderRequest } from '../../models/menu.model';

@Component({
  selector: 'app-customer-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-menu.component.html',
  styleUrl: './customer-menu.component.css'
})
export class CustomerMenuComponent implements OnInit {
  menuItems: MonAn[] = [];
  cartItems: CartItem[] = [];
  totalPrice: number = 0;
  
  errorMessage: string = '';
  successMessage: string = '';
  isOrdering: boolean = false;

  private customerService = inject(CustomerService);
  
  // KHAI BÁO THÊM 2 BIẾN NÀY ĐỂ TRỊ BỆNH SSR VÀ LƯỜI RENDER CỦA ANGULAR
  private platformId = inject(PLATFORM_ID);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    // CHỈ CHẠY GỌI API KHI ĐANG Ở TRÊN TRÌNH DUYỆT BROWSER (KHÔNG CHẠY NGẦM TRÊN SERVER NỮA)
    if (isPlatformBrowser(this.platformId)) {
      this.loadMenu();
    }
    
    // Theo dõi giỏ hàng thay đổi
    this.customerService.cart$.subscribe(items => {
      this.cartItems = items;
      this.totalPrice = this.customerService.getCartTotal();
      this.cdr.detectChanges(); // Ép giao diện cập nhật ngay lập tức
    });
  }

  loadMenu() {
    this.customerService.getMenu().subscribe({
      next: (data) => {
        this.menuItems = data;
        this.cdr.detectChanges(); // Ép giao diện vẽ danh sách món ăn ngay lập tức
      },
      error: () => {
        this.errorMessage = 'Không thể tải thực đơn. Vui lòng kiểm tra kết nối mạng!';
        this.cdr.detectChanges(); 
      }
    });
  }

  onAddToCart(item: MonAn) {
    this.customerService.addToCart(item);
  }

  onRemoveFromCart(maMonAn: number) {
    this.customerService.removeFromCart(maMonAn);
  }

  onCheckout() {
    if (this.cartItems.length === 0) return;

    this.isOrdering = true;
    this.errorMessage = '';
    this.successMessage = '';

    const orderPayload: OrderRequest = {
      loaiDonHang: 'Tại quán',
      phuongThucThanhToan: 'Tiền mặt',
      chiTietDonHang: this.cartItems.map(item => ({
        maMonAn: item.monAn.maMonAn,
        soLuong: item.soLuong,
        giaLucDat: item.monAn.gia
      }))
    };

    this.customerService.placeOrder(orderPayload).subscribe({
      next: (res) => {
        this.successMessage = 'Đặt món thành công! Đơn hàng đã được chuyển xuống bếp.';
        this.customerService.clearCart();
        this.isOrdering = false;
        this.cdr.detectChanges(); // Ép giao diện cập nhật thông báo
      },
      error: (err) => {
        this.errorMessage = 'Lỗi đặt hàng. Vui lòng thử lại!';
        this.isOrdering = false;
        this.cdr.detectChanges(); 
      }
    });
  }
}