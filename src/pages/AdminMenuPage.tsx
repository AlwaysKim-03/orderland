import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Upload, 
  Edit3, 
  Trash2, 
  GripVertical,
  Soup,
  Fish,
  Coffee,
  Utensils,
  ImageIcon,
  Video,
  AlertTriangle,
  Package,
  StopCircle,
  Star,
  Crown,
  Award
} from "lucide-react";
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  video?: string;
  categoryId: string;
  icon?: string;
  status: {
    soldOut: boolean;
    ingredientsOut: boolean;
    salesStopped: boolean;
  };
  badge?: {
    type: "recommend" | "best" | "new";
    text: string;
  };
}

interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

const defaultCategoryIcons = {
  "국물류": Soup,
  "육류": Utensils,
  "해산물": Fish,
  "음료": Coffee,
};

export default function AdminMenuPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);

  // Firebase에서 카테고리 데이터 가져오기
  useEffect(() => {
    const categoriesQuery = query(collection(db, "categories"), orderBy("order"));
    const unsubscribe = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(categoriesData);
    });

    return () => unsubscribe();
  }, []);

  // Firebase에서 메뉴 데이터 가져오기
  useEffect(() => {
    const menuQuery = query(collection(db, "menus"), orderBy("name"));
    const unsubscribe = onSnapshot(menuQuery, (snapshot) => {
      const menuData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MenuItem[];
      setMenuItems(menuData);
    });

    return () => unsubscribe();
  }, []);

  // Empty state when no categories or menu items
  const isEmpty = categories.length === 0 && menuItems.length === 0;

  const handleAddCategory = async (name: string) => {
    try {
      const newCategory: Omit<Category, "id"> = {
        name,
        icon: defaultCategoryIcons[name as keyof typeof defaultCategoryIcons] ? name : "Utensils",
        order: categories.length + 1
      };
      
      await addDoc(collection(db, "categories"), newCategory);
      setIsAddCategoryOpen(false);
      toast({
        title: "카테고리 추가됨",
        description: `"${name}" 카테고리가 추가되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "카테고리 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleAddMenu = async (menuData: Omit<MenuItem, "id">) => {
    try {
      await addDoc(collection(db, "menus"), menuData);
      setIsAddMenuOpen(false);
      toast({
        title: "메뉴 추가됨",
        description: `"${menuData.name}" 메뉴가 추가되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "메뉴 추가 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleEditMenu = async (menuData: MenuItem) => {
    try {
      const menuRef = doc(db, "menus", menuData.id);
      await updateDoc(menuRef, {
        name: menuData.name,
        description: menuData.description,
        price: menuData.price,
        image: menuData.image,
        video: menuData.video,
        categoryId: menuData.categoryId,
        icon: menuData.icon,
        status: menuData.status,
        badge: menuData.badge
      });
      
      setIsEditMenuOpen(false);
      setEditingMenu(null);
      toast({
        title: "메뉴 수정됨",
        description: `"${menuData.name}" 메뉴가 수정되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "메뉴 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (menuId: string, statusType: keyof MenuItem["status"]) => {
    try {
      const menu = menuItems.find(item => item.id === menuId);
      if (!menu) return;

      const newStatus = {
        ...menu.status,
        [statusType]: !menu.status[statusType]
      };

      const menuRef = doc(db, "menus", menuId);
      await updateDoc(menuRef, { status: newStatus });
      
      const statusText = {
        soldOut: "품절",
        ingredientsOut: "재료 소진", 
        salesStopped: "판매 중지"
      };
      
      toast({
        title: `상태 변경됨`,
        description: `"${menu.name}" ${statusText[statusType]} 상태가 변경되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "상태 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleToggleBadge = async (menuId: string, badgeType: "recommend" | "best" | "new" | null) => {
    try {
      const menuRef = doc(db, "menus", menuId);
      const badgeData = badgeType ? {
        type: badgeType,
        text: badgeType === "recommend" ? "사장님 추천" : 
              badgeType === "best" ? "베스트 메뉴" : "신메뉴"
      } : null;
      
      await updateDoc(menuRef, { badge: badgeData });
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "배지 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMenu = async (menuId: string) => {
    try {
      const menu = menuItems.find(item => item.id === menuId);
      await deleteDoc(doc(db, "menus", menuId));
      toast({
        title: "메뉴 삭제됨",
        description: `"${menu?.name}" 메뉴가 삭제되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "메뉴 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const category = categories.find(cat => cat.id === categoryId);
      const categoryMenus = menuItems.filter(item => item.categoryId === categoryId);
      
      // 카테고리 삭제
      await deleteDoc(doc(db, "categories", categoryId));
      
      // 해당 카테고리의 메뉴들도 삭제
      for (const menu of categoryMenus) {
        await deleteDoc(doc(db, "menus", menu.id));
      }
      
      toast({
        title: "카테고리 삭제됨",
        description: `"${category?.name}" 카테고리와 ${categoryMenus.length}개의 메뉴가 삭제되었습니다.`,
      });
    } catch (error) {
      toast({
        title: "오류 발생",
        description: "카테고리 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const openEditMenu = (menu: MenuItem) => {
    setEditingMenu(menu);
    setIsEditMenuOpen(true);
  };

  if (isEmpty) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mb-8">
              <Utensils className="w-16 h-16 text-muted-foreground" />
            </div>
            
            <h2 className="text-3xl font-bold text-foreground mb-4">
              메뉴를 추가해주세요
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-md">
              아직 등록된 메뉴가 없습니다.<br />
              카테고리를 먼저 만들고 메뉴를 추가해보세요.
            </p>

            <div className="flex gap-6">
              <AddCategoryDialog 
                isOpen={isAddCategoryOpen}
                onOpenChange={setIsAddCategoryOpen}
                onAdd={handleAddCategory}
              >
                <Button size="lg" className="h-16 px-8 text-lg">
                  <Plus className="w-6 h-6 mr-3" />
                  카테고리 추가
                </Button>
              </AddCategoryDialog>

              <AddMenuDialog
                categories={categories}
                isOpen={isAddMenuOpen}
                onOpenChange={setIsAddMenuOpen}
                onAdd={handleAddMenu}
              >
                <Button size="lg" variant="outline" className="h-16 px-8 text-lg">
                  <Plus className="w-6 h-6 mr-3" />
                  메뉴 추가
                </Button>
              </AddMenuDialog>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">메뉴 관리</h1>
            <p className="text-muted-foreground mt-2">메뉴와 카테고리를 관리하세요</p>
          </div>
          
          <div className="flex gap-3">
            <AddCategoryDialog 
              isOpen={isAddCategoryOpen}
              onOpenChange={setIsAddCategoryOpen}
              onAdd={handleAddCategory}
            >
              <Button variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                카테고리 추가
              </Button>
            </AddCategoryDialog>

            <AddMenuDialog
              categories={categories}
              isOpen={isAddMenuOpen}
              onOpenChange={setIsAddMenuOpen}
              onAdd={handleAddMenu}
            >
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                메뉴 추가
              </Button>
            </AddMenuDialog>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-4">카테고리</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => {
              const IconComponent = defaultCategoryIcons[category.name as keyof typeof defaultCategoryIcons] || Utensils;
              const categoryMenus = menuItems.filter(item => item.categoryId === category.id);

              
              return (
                <Card key={category.id} className="relative group">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{category.name}</CardTitle>
                          <CardDescription>{categoryMenus.length}개 메뉴</CardDescription>
                        </div>
                      </div>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>카테고리 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              "{category.name}" 카테고리와 {categoryMenus.length}개의 메뉴를 삭제하시겠습니까?
                              이 작업은 되돌릴 수 없습니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteCategory(category.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-2">
                      {categoryMenus.slice(0, 3).map((menu) => (
                        <div key={menu.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span className="text-sm font-medium">{menu.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ₩{menu.price.toLocaleString()}
                            </span>
                          </div>
                          
                          {menu.status.soldOut && (
                            <Badge variant="secondary" className="text-xs">
                              품절
                            </Badge>
                          )}
                        </div>
                      ))}
                      
                      {categoryMenus.length > 3 && (
                        <div className="text-center pt-2">
                          <span className="text-xs text-muted-foreground">
                            +{categoryMenus.length - 3}개 더
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Menu Items */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">전체 메뉴</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {menuItems.map((menu) => {
              const category = categories.find(cat => cat.id === menu.categoryId);
              const IconComponent = menu.icon ? defaultCategoryIcons[menu.icon as keyof typeof defaultCategoryIcons] || Utensils : Utensils;

              
              return (
                <Card key={menu.id} className="relative group">
                  {/* Menu Image */}
                  {menu.image && (
                    <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                      <img 
                        src={menu.image} 
                        alt={menu.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{menu.name}</CardTitle>
                          {menu.badge && (
                            <Badge 
                              variant={menu.badge.type === "recommend" ? "default" : 
                                     menu.badge.type === "best" ? "secondary" : "outline"}
                              className="text-xs"
                            >
                              {menu.badge.text}
                            </Badge>
                          )}
                        </div>
                        
                        <CardDescription className="mb-2">
                          {menu.description}
                        </CardDescription>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <IconComponent className="w-4 h-4" />
                          <span>{category?.name}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditMenu(menu)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>메뉴 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                "{menu.name}" 메뉴를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteMenu(menu.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-2xl font-bold text-primary">
                        ₩{menu.price.toLocaleString()}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {menu.badge && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleBadge(menu.id, null)}
                              className="h-6 px-2 text-xs"
                            >
                              배지 제거
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Controls */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">품절</span>
                        </div>
                        <Switch
                          checked={menu.status.soldOut}
                          onCheckedChange={() => handleToggleStatus(menu.id, "soldOut")}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">재료 소진</span>
                        </div>
                        <Switch
                          checked={menu.status.ingredientsOut}
                          onCheckedChange={() => handleToggleStatus(menu.id, "ingredientsOut")}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StopCircle className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">판매 중지</span>
                        </div>
                        <Switch
                          checked={menu.status.salesStopped}
                          onCheckedChange={() => handleToggleStatus(menu.id, "salesStopped")}
                        />
                      </div>
                    </div>
                    
                    {/* Badge Controls */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">배지 설정</div>
                      <div className="flex gap-2">
                        <Button
                          variant={menu.badge?.type === "recommend" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleBadge(menu.id, "recommend")}
                          className="text-xs"
                        >
                          <Star className="w-3 h-3 mr-1" />
                          추천
                        </Button>
                        <Button
                          variant={menu.badge?.type === "best" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleBadge(menu.id, "best")}
                          className="text-xs"
                        >
                          <Crown className="w-3 h-3 mr-1" />
                          베스트
                        </Button>
                        <Button
                          variant={menu.badge?.type === "new" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleToggleBadge(menu.id, "new")}
                          className="text-xs"
                        >
                          <Award className="w-3 h-3 mr-1" />
                          신메뉴
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Dialogs */}
        {editingMenu && (
          <EditMenuDialog
            menu={editingMenu}
            categories={categories}
            isOpen={isEditMenuOpen}
            onOpenChange={setIsEditMenuOpen}
            onEdit={handleEditMenu}
          />
        )}
      </div>
    </AdminLayout>
  );
}

// Add Category Dialog Component
function AddCategoryDialog({ 
  children, 
  isOpen, 
  onOpenChange, 
  onAdd 
}: { 
  children: React.ReactNode;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string) => void;
}) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName("");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>카테고리 추가</DialogTitle>
          <DialogDescription>
            새로운 메뉴 카테고리를 추가합니다.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category-name">카테고리 이름</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 국물류, 육류, 음료"
              className="mt-2"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!name.trim()}>
              추가
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Menu Dialog Component
function AddMenuDialog({ 
  children, 
  categories, 
  isOpen, 
  onOpenChange, 
  onAdd 
}: { 
  children: React.ReactNode;
  categories: Category[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (menu: Omit<MenuItem, "id">) => void;
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    image: "",
    video: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.price && formData.categoryId) {
      onAdd({
        ...formData,
        price: parseInt(formData.price),
        status: {
          soldOut: false,
          ingredientsOut: false,
          salesStopped: false
        }
      });
      setFormData({
        name: "",
        description: "",
        price: "",
        categoryId: "",
        image: "",
        video: ""
      });
    }
  };

  const handleImageUpload = (url: string) => {
    setFormData({ ...formData, image: url });
  };

  const handleVideoUpload = (url: string) => {
    setFormData({ ...formData, video: url });
  };

  const handleImageRemove = () => {
    setFormData({ ...formData, image: "" });
  };

  const handleVideoRemove = () => {
    setFormData({ ...formData, video: "" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>메뉴 추가</DialogTitle>
          <DialogDescription>
            새로운 메뉴를 추가합니다. 이미지와 동영상을 업로드할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="menu-name">메뉴 이름 *</Label>
              <Input
                id="menu-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="메뉴 이름을 입력하세요"
              />
            </div>
            
            <div>
              <Label htmlFor="menu-price">가격 *</Label>
              <Input
                id="menu-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="menu-category">카테고리 *</Label>
            <select
              id="menu-category"
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
              className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
            >
              <option value="">카테고리 선택</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="menu-description">설명</Label>
            <Textarea
              id="menu-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="메뉴 설명을 입력하세요"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUpload
              label="메뉴 이미지"
              accept="image/*"
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              currentUrl={formData.image}
              maxSize={5}
            />
            
            <FileUpload
              label="메뉴 동영상"
              accept="video/*"
              onUpload={handleVideoUpload}
              onRemove={handleVideoRemove}
              currentUrl={formData.video}
              maxSize={50}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.price || !formData.categoryId}>
              메뉴 추가
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Menu Dialog Component
function EditMenuDialog({ 
  menu, 
  categories, 
  isOpen, 
  onOpenChange, 
  onEdit 
}: { 
  menu: MenuItem;
  categories: Category[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (menu: MenuItem) => void;
}) {
  const [formData, setFormData] = useState({
    name: menu.name,
    description: menu.description,
    price: menu.price.toString(),
    categoryId: menu.categoryId,
    image: menu.image || "",
    video: menu.video || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.price && formData.categoryId) {
      onEdit({
        ...menu,
        ...formData,
        price: parseInt(formData.price),
        icon: menu.icon // 기존 icon 값 유지
      });
    }
  };

  const handleImageUpload = (url: string) => {
    setFormData({ ...formData, image: url });
  };

  const handleVideoUpload = (url: string) => {
    setFormData({ ...formData, video: url });
  };

  const handleImageRemove = () => {
    setFormData({ ...formData, image: "" });
  };

  const handleVideoRemove = () => {
    setFormData({ ...formData, video: "" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>메뉴 수정</DialogTitle>
          <DialogDescription>
            메뉴 정보를 수정합니다. 이미지와 동영상을 업로드할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-menu-name">메뉴 이름 *</Label>
              <Input
                id="edit-menu-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="메뉴 이름을 입력하세요"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-menu-price">가격 *</Label>
              <Input
                id="edit-menu-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                placeholder="0"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-menu-category">카테고리 *</Label>
            <select
              id="edit-menu-category"
              value={formData.categoryId}
              onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
              className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <Label htmlFor="edit-menu-description">설명</Label>
            <Textarea
              id="edit-menu-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="메뉴 설명을 입력하세요"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FileUpload
              label="메뉴 이미지"
              accept="image/*"
              onUpload={handleImageUpload}
              onRemove={handleImageRemove}
              currentUrl={formData.image}
              maxSize={5}
            />
            
            <FileUpload
              label="메뉴 동영상"
              accept="video/*"
              onUpload={handleVideoUpload}
              onRemove={handleVideoRemove}
              currentUrl={formData.video}
              maxSize={50}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.price || !formData.categoryId}>
              메뉴 수정
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}