import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Store,
  BarChart3,
  Settings,
  Crown,
  Shield,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle,
  Clock,
  LogOut,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  FileText,
  Eye,
  X
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { collection, getDocs, doc, updateDoc, query, orderBy, where, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase";

interface StoreOwner {
  id: string;
  uid: string;
  email: string;
  name: string;
  storeName: string;
  phone: string;
  status: 'active' | 'inactive' | 'pending';
  createdAt: any;
  lastLogin?: string;
  orderCount: number;
  totalRevenue: number;
  businessVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  role: string;
  isActive: boolean;
  businessDocument?: string;
  businessDocumentUrl?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
}

export default function SuperAdminDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [storeOwners, setStoreOwners] = useState<StoreOwner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [approvalFilter, setApprovalFilter] = useState<string>("all");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<StoreOwner | null>(null);

  // Firestore에서 사장님 데이터 가져오기
  useEffect(() => {
    const fetchStoreOwners = async () => {
      try {
        console.log('사장님 데이터 가져오기 시작');
        
        // users 컬렉션에서 모든 사용자 가져오기
        const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
        const usersSnapshot = await getDocs(usersQuery);
        
        const ownersData: StoreOwner[] = [];
        
        usersSnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('사용자 데이터:', data);
          
          // 기본값 설정
          const owner: StoreOwner = {
            id: doc.id,
            uid: data.uid || doc.id,
            email: data.email || '',
            name: data.name || '',
            storeName: data.storeName || '',
            phone: data.phone || '',
            status: data.isActive ? 'active' : 'inactive',
            createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
            lastLogin: data.lastLogin || '',
            orderCount: data.orderCount || 0,
            totalRevenue: data.totalRevenue || 0,
            businessVerified: data.businessVerified || false,
            emailVerified: data.emailVerified || false,
            phoneVerified: data.phoneVerified || false,
            role: data.role || 'admin',
            isActive: data.isActive || false,
            businessDocument: data.businessDocument || '',
            businessDocumentUrl: data.businessDocumentUrl || '',
            approvalStatus: data.approvalStatus || 'pending'
          };
          
          ownersData.push(owner);
        });
        
        console.log('가져온 사장님 데이터:', ownersData);
        setStoreOwners(ownersData);
        setIsLoading(false);
        
      } catch (error) {
        console.error('사장님 데이터 가져오기 오류:', error);
        toast({
          title: "데이터 로드 실패",
          description: "사장님 정보를 가져오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        setIsLoading(false);
      }
    };

    // 실시간 리스너 설정
    const usersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
      console.log('실시간 업데이트 감지');
      const ownersData: StoreOwner[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        const owner: StoreOwner = {
          id: doc.id,
          uid: data.uid || doc.id,
          email: data.email || '',
          name: data.name || '',
          storeName: data.storeName || '',
          phone: data.phone || '',
          status: data.isActive ? 'active' : 'inactive',
          createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
          lastLogin: data.lastLogin || '',
          orderCount: data.orderCount || 0,
          totalRevenue: data.totalRevenue || 0,
          businessVerified: data.businessVerified || false,
          emailVerified: data.emailVerified || false,
          phoneVerified: data.phoneVerified || false,
          role: data.role || 'admin',
          isActive: data.isActive || false,
          businessDocument: data.businessDocument || '',
          businessDocumentUrl: data.businessDocumentUrl || '',
          approvalStatus: data.approvalStatus || 'pending'
        };
        
        ownersData.push(owner);
      });
      
      setStoreOwners(ownersData);
      setIsLoading(false);
    }, (error) => {
      console.error('실시간 리스너 오류:', error);
      // 실시간 리스너 실패 시 초기 로드 실행
      fetchStoreOwners();
    });

    // 컴포넌트 언마운트 시 리스너 정리
    return () => unsubscribe();
  }, [toast]);

  // 페이지 로드 시 관리자 접속 알림
  useEffect(() => {
    toast({
      title: "관리자 접속",
      description: "최고 관리자 페이지에 접속했습니다.",
    });
  }, [toast]);

  const handleLogout = async () => {
    try {
      // 관리자 세션 제거
      localStorage.removeItem('orderland-admin-session');
      
      await signOut(auth);
      toast({
        title: "로그아웃 완료",
        description: "안전하게 로그아웃되었습니다.",
      });
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 사장님 상태 변경 함수
  const handleToggleStatus = async (ownerId: string, newStatus: boolean) => {
    try {
      const owner = storeOwners.find(o => o.id === ownerId);
      if (!owner) {
        toast({
          title: "오류",
          description: "사장님 정보를 찾을 수 없습니다.",
          variant: "destructive",
        });
        return;
      }

      console.log('상태 변경 시작:', {
        ownerId,
        storeName: owner.storeName,
        currentStatus: owner.isActive,
        newStatus
      });

      // Firestore 업데이트
      await updateDoc(doc(db, "users", ownerId), {
        isActive: newStatus,
        updatedAt: new Date(),
        updatedBy: 'super-admin',
        statusChangeHistory: {
          timestamp: new Date(),
          from: owner.isActive,
          to: newStatus,
          changedBy: 'super-admin'
        }
      });

      console.log('Firestore 업데이트 완료');

      // 실시간 리스너가 자동으로 업데이트하므로 로컬 상태 업데이트는 제거
      // setStoreOwners(prev => prev.map(o => 
      //   o.id === ownerId 
      //     ? { 
      //         ...o, 
      //         isActive: newStatus, 
      //         status: newStatus ? 'active' : 'inactive' 
      //       }
      //     : o
      // ));

      console.log('상태 변경 완료 - 실시간 리스너가 업데이트를 처리합니다');

      toast({
        title: "상태 변경 완료",
        description: `${owner.storeName}의 상태가 ${newStatus ? '활성' : '비활성'}으로 변경되었습니다.`,
      });
    } catch (error) {
      console.error('상태 변경 오류:', error);
      toast({
        title: "상태 변경 실패",
        description: "상태 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 사업자등록 승인 함수
  const handleBusinessApproval = async (ownerId: string, approved: boolean) => {
    try {
      const owner = storeOwners.find(o => o.id === ownerId);
      if (!owner) return;

      const approvalStatus = approved ? 'approved' : 'rejected';
      const isActive = approved;
      const businessVerified = approved;

      // Firestore 업데이트
      await updateDoc(doc(db, "users", ownerId), {
        approvalStatus,
        isActive,
        businessVerified,
        approvedAt: new Date()
      });

      // 로컬 상태 업데이트
      setStoreOwners(prev => prev.map(o => 
        o.id === ownerId 
          ? { 
              ...o, 
              approvalStatus, 
              isActive, 
              businessVerified, 
              status: isActive ? 'active' : 'inactive' 
            }
          : o
      ));

      toast({
        title: approved ? "승인 완료" : "거절 완료",
        description: `${owner.storeName}의 사업자등록이 ${approved ? '승인' : '거절'}되었습니다.`,
      });
    } catch (error) {
      console.error('승인 처리 오류:', error);
      toast({
        title: "승인 처리 실패",
        description: "승인 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 사업자등록 파일 다운로드 함수
  const handleDownloadDocument = (url: string, fileName: string) => {
    if (!url) {
      toast({
        title: "파일 없음",
        description: "업로드된 파일이 없습니다.",
        variant: "destructive",
      });
      return;
    }

    // 새 탭에서 파일 다운로드
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 파일 검토 모달 열기
  const openReviewModal = (owner: StoreOwner) => {
    setSelectedOwner(owner);
    setReviewModalOpen(true);
  };

  // 파일 검토 모달 닫기
  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setSelectedOwner(null);
  };

  // 검토 후 승인/거절 처리
  const handleReviewApproval = async (approved: boolean) => {
    if (!selectedOwner) return;

    try {
      const approvalStatus = approved ? 'approved' : 'rejected';
      const isActive = approved;
      const businessVerified = approved;

      // Firestore 업데이트
      await updateDoc(doc(db, "users", selectedOwner.id), {
        approvalStatus,
        isActive,
        businessVerified,
        approvedAt: new Date(),
        reviewedBy: 'super-admin',
        reviewNote: approved ? '사업자등록 검토 완료 - 승인' : '사업자등록 검토 완료 - 거절'
      });

      // 로컬 상태 업데이트
      setStoreOwners(prev => prev.map(o => 
        o.id === selectedOwner.id 
          ? { 
              ...o, 
              approvalStatus, 
              isActive, 
              businessVerified, 
              status: isActive ? 'active' : 'inactive' 
            }
          : o
      ));

      toast({
        title: approved ? "승인 완료" : "거절 완료",
        description: `${selectedOwner.storeName}의 사업자등록이 ${approved ? '승인' : '거절'}되었습니다.`,
      });

      closeReviewModal();
    } catch (error) {
      console.error('승인 처리 오류:', error);
      toast({
        title: "승인 처리 실패",
        description: "승인 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const filteredStoreOwners = storeOwners.filter(owner => {
    const matchesSearch = owner.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         owner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         owner.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || owner.status === statusFilter;
    const matchesApproval = approvalFilter === "all" || owner.approvalStatus === approvalFilter;
    return matchesSearch && matchesStatus && matchesApproval;
  });

  const stats = {
    totalOwners: storeOwners.length,
    activeOwners: storeOwners.filter(o => o.status === 'active').length,
    inactiveOwners: storeOwners.filter(o => o.status === 'inactive').length,
    totalOrders: storeOwners.reduce((sum, o) => sum + o.orderCount, 0),
    totalRevenue: storeOwners.reduce((sum, o) => sum + o.totalRevenue, 0),
    pendingApprovals: storeOwners.filter(o => o.approvalStatus === 'pending').length
  };

  // 로딩 중일 때 스피너 표시
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">사장님 데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Crown className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">최고 관리자</h1>
                <p className="text-sm text-gray-500">오더랜드 전체 관리</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1">
                <Shield className="w-3 h-3" />
                최고 관리자
              </Badge>
              <Button variant="outline" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              전체 현황
            </TabsTrigger>
            <TabsTrigger value="owners" className="gap-2">
              <Users className="w-4 h-4" />
              사장님 관리
            </TabsTrigger>
            <TabsTrigger value="stores" className="gap-2">
              <Store className="w-4 h-4" />
              매장 관리
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              시스템 설정
            </TabsTrigger>
          </TabsList>

          {/* 전체 현황 탭 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">전체 사장님</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOwners}</div>
                  <p className="text-xs text-muted-foreground">
                    등록된 사장님 수
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">활성 사장님</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.activeOwners}</div>
                  <p className="text-xs text-muted-foreground">
                    현재 활성 상태
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 주문 수</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    전체 주문 건수
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 매출</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">₩{stats.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    전체 매출액
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">승인 대기</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.pendingApprovals}</div>
                  <p className="text-xs text-muted-foreground">
                    승인 대기 중인 사장님
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>최근 활동</CardTitle>
                <CardDescription>최근 7일간의 시스템 활동</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">새로운 사장님 등록</p>
                        <p className="text-sm text-muted-foreground">맛있는 돈까스 - 2시간 전</p>
                      </div>
                    </div>
                    <Badge variant="secondary">신규</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium">시스템 업데이트</p>
                        <p className="text-sm text-muted-foreground">QR 코드 관리 기능 개선 - 1일 전</p>
                      </div>
                    </div>
                    <Badge variant="outline">업데이트</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-medium">비활성 사장님</p>
                        <p className="text-sm text-muted-foreground">따뜻한 라면 - 3일 전</p>
                      </div>
                    </div>
                    <Badge variant="destructive">비활성</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 사장님 관리 탭 */}
          <TabsContent value="owners" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>사장님 관리</CardTitle>
                    <CardDescription>등록된 모든 사장님 계정을 관리합니다</CardDescription>
                  </div>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    사장님 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 검색 및 필터 */}
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Label htmlFor="search">검색</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="매장명 또는 이메일로 검색"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="w-48">
                      <Label htmlFor="status">상태 필터</Label>
                      <select
                        id="status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                      >
                        <option value="all">전체</option>
                        <option value="active">활성</option>
                        <option value="inactive">비활성</option>
                        <option value="pending">대기</option>
                      </select>
                    </div>
                    <div className="w-48">
                      <Label htmlFor="approval">승인 상태</Label>
                      <select
                        id="approval"
                        value={approvalFilter}
                        onChange={(e) => setApprovalFilter(e.target.value)}
                        className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                      >
                        <option value="all">전체</option>
                        <option value="pending">승인 대기</option>
                        <option value="approved">승인됨</option>
                        <option value="rejected">거절됨</option>
                      </select>
                    </div>
                  </div>

                  {/* 사장님 목록 */}
                  <div className="space-y-3">
                    {filteredStoreOwners.map((owner) => (
                      <div key={owner.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Store className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-medium">{owner.storeName}</h3>
                            <p className="text-sm text-muted-foreground">{owner.name} ({owner.email})</p>
                            <p className="text-xs text-muted-foreground">
                              전화번호: {owner.phone} | 가입일: {owner.createdAt.toLocaleDateString()}
                            </p>
                            <div className="flex gap-2 mt-1">
                              {owner.emailVerified && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  이메일 인증
                                </Badge>
                              )}
                              {owner.phoneVerified && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  전화번호 인증
                                </Badge>
                              )}
                              {owner.businessVerified && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  사업자 인증
                                </Badge>
                              )}
                              {owner.approvalStatus === 'pending' && (
                                <Badge variant="secondary" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  승인 대기
                                </Badge>
                              )}
                              {owner.approvalStatus === 'approved' && (
                                <Badge variant="default" className="text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  승인됨
                                </Badge>
                              )}
                              {owner.approvalStatus === 'rejected' && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  거절됨
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{owner.orderCount}건 주문</p>
                            <p className="text-sm text-muted-foreground">₩{owner.totalRevenue.toLocaleString()}</p>
                          </div>
                          
                          <Badge 
                            variant={owner.status === 'active' ? 'default' : 
                                   owner.status === 'inactive' ? 'destructive' : 'secondary'}
                          >
                            {owner.status === 'active' ? '활성' : 
                             owner.status === 'inactive' ? '비활성' : '대기'}
                          </Badge>
                          
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              상세보기
                            </Button>
                            
                            {/* 사업자등록 파일 확인 버튼 */}
                            {owner.businessDocument && owner.businessDocument !== "없음" && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openReviewModal(owner)}
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                파일 검토
                              </Button>
                            )}
                            
                            {/* 승인 대기 중인 경우 승인/거절 버튼 */}
                            {owner.approvalStatus === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  onClick={() => handleBusinessApproval(owner.id, true)}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  승인
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => handleBusinessApproval(owner.id, false)}
                                >
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  거절
                                </Button>
                              </>
                            )}
                            
                            {/* 이미 승인된 경우 활성화/비활성화 버튼 */}
                            {owner.approvalStatus === 'approved' && (
                              <Button 
                                size="sm" 
                                variant={owner.isActive ? "destructive" : "default"}
                                onClick={() => handleToggleStatus(owner.id, !owner.isActive)}
                              >
                                {owner.isActive ? '비활성화' : '활성화'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 매장 관리 탭 */}
          <TabsContent value="stores" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>매장 관리</CardTitle>
                <CardDescription>전체 매장의 운영 상태를 관리합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">매장 관리 기능은 준비 중입니다.</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 시스템 설정 탭 */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>시스템 설정</CardTitle>
                <CardDescription>전체 시스템의 설정을 관리합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">시스템 업데이트</h3>
                      <p className="text-sm text-muted-foreground">최신 버전으로 업데이트</p>
                    </div>
                    <Button variant="outline">업데이트 확인</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">데이터 백업</h3>
                      <p className="text-sm text-muted-foreground">전체 데이터 백업</p>
                    </div>
                    <Button variant="outline" className="gap-2">
                      <Download className="w-4 h-4" />
                      백업 다운로드
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h3 className="font-medium">시스템 로그</h3>
                      <p className="text-sm text-muted-foreground">시스템 활동 로그 확인</p>
                    </div>
                    <Button variant="outline">로그 보기</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 파일 검토 모달 */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>사업자등록 파일 검토</DialogTitle>
            <DialogDescription>
              {selectedOwner?.storeName}의 사업자등록 파일을 검토하고 승인 또는 거절을 결정하세요.
            </DialogDescription>
          </DialogHeader>
          
          {selectedOwner && (
            <div className="space-y-6">
              {/* 사장님 정보 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <h3 className="font-medium">매장 정보</h3>
                  <p className="text-sm text-muted-foreground">매장명: {selectedOwner.storeName}</p>
                  <p className="text-sm text-muted-foreground">사장님: {selectedOwner.name}</p>
                  <p className="text-sm text-muted-foreground">이메일: {selectedOwner.email}</p>
                  <p className="text-sm text-muted-foreground">전화번호: {selectedOwner.phone}</p>
                </div>
                <div>
                  <h3 className="font-medium">인증 상태</h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {selectedOwner.emailVerified ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">이메일 인증</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedOwner.phoneVerified ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">전화번호 인증</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedOwner.businessVerified ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                      <span className="text-sm">사업자 인증</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 파일 정보 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">업로드된 파일</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownloadDocument(selectedOwner.businessDocumentUrl || '', selectedOwner.businessDocument || '')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    파일 다운로드
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium">파일명: {selectedOwner.businessDocument}</p>
                  <p className="text-sm text-muted-foreground">
                    파일 URL: {selectedOwner.businessDocumentUrl ? '업로드됨' : '업로드되지 않음'}
                  </p>
                </div>

                {/* 파일 미리보기 (이미지인 경우) */}
                {selectedOwner.businessDocumentUrl && (
                  <div className="space-y-2">
                    <h4 className="font-medium">파일 미리보기</h4>
                    <div className="border rounded-lg p-4">
                      {selectedOwner.businessDocument?.toLowerCase().includes('.pdf') ? (
                        <div className="text-center py-8">
                          <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                          <p className="text-sm text-muted-foreground">PDF 파일은 미리보기를 지원하지 않습니다.</p>
                          <p className="text-sm text-muted-foreground">다운로드하여 확인해주세요.</p>
                        </div>
                      ) : (
                        <div>
                          <img 
                            src={selectedOwner.businessDocumentUrl} 
                            alt="사업자등록증" 
                            className="max-w-full h-auto rounded-lg"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.style.display = 'none';
                              const nextElement = target.nextElementSibling as HTMLElement;
                              if (nextElement) {
                                nextElement.style.display = 'block';
                              }
                            }}
                          />
                          <div className="hidden text-center py-8">
                            <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground">이미지를 불러올 수 없습니다.</p>
                            <p className="text-sm text-muted-foreground">다운로드하여 확인해주세요.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 승인/거절 버튼 */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={closeReviewModal}>
                  취소
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleReviewApproval(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  거절
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => handleReviewApproval(true)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  승인
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 