import { useState } from "react";
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

const defaultCategoryIcons = {
  "국물류": Soup,
  "육류": Utensils,
  "해산물": Fish,
  "음료": Coffee,
};

const initialCategories = [
  { id: "1", name: "국물류", icon: "Soup", order: 1 },
  { id: "2", name: "육류", icon: "Utensils", order: 2 },
];

const initialMenuItems = [
  {
    id: "1",
    name: "김치찌개",
    description: "매콤한 김치찌개",
    price: 8000,
    categoryId: "1",
    icon: "Soup",
    status: {
      soldOut: false,
      ingredientsOut: false,
      salesStopped: false
    },
    badge: {
      type: "recommend",
      text: "사장님 추천"
    }
  },
  {
    id: "2", 
    name: "불고기",
    description: "부드러운 한우 불고기",
    price: 15000,
    categoryId: "2",
    icon: "Utensils",
    status: {
      soldOut: false,
      ingredientsOut: false,
      salesStopped: false
    },
    badge: {
      type: "best",
      text: "베스트 메뉴"
    }
  }
];

export default function AdminMenuPage() {
  const [categories, setCategories] = useState(initialCategories);
  const [menuItems, setMenuItems] = useState(initialMenuItems);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditMenuOpen, setIsEditMenuOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState(null);
  const { toast } = useToast();

  // Empty state when no categories or menu items
  const isEmpty = categories.length === 0 && menuItems.length === 0;

  const handleAddCategory = (name) => {
    const newCategory = {
      id: Date.now().toString(),
      name,
      icon: defaultCategoryIcons[name] ? name : "Utensils",
      order: categories.length + 1
    };
    setCategories([...categories, newCategory]);
    setIsAddCategoryOpen(false);
    toast({
      title: "카테고리 추가됨",
      description: `"${name}" 카테고리가 추가되었습니다.`,
    });
  };

  const handleAddMenu = (menuData) => {
    const newMenu = {
      ...menuData,
      id: Date.now().toString(),
    };
    setMenuItems([...menuItems, newMenu]);
    setIsAddMenuOpen(false);
    toast({
      title: "메뉴 추가됨",
      description: `"${menuData.name}" 메뉴가 추가되었습니다.`,
    });
  };

  const handleEditMenu = (menuData) => {
    setMenuItems(menuItems.map(item => 
      item.id === menuData.id ? menuData : item
    ));
    setIsEditMenuOpen(false);
    setEditingMenu(null);
    toast({
      title: "메뉴 수정됨",
      description: `"${menuData.name}" 메뉴가 수정되었습니다.`,
    });
  };

  const handleToggleStatus = (menuId, statusType) => {
    setMenuItems(menuItems.map(item => 
      item.id === menuId 
        ? {
            ...item,
            status: {
              ...item.status,
              [statusType]: !item.status[statusType]
            }
          }
        : item
    ));
    
    const menu = menuItems.find(item => item.id === menuId);
    const statusText = {
      soldOut: "품절",
      ingredientsOut: "재료 소진", 
      salesStopped: "판매 중지"
    };
    
    toast({
      title: `상태 변경됨`,
      description: `"${menu?.name}" ${statusText[statusType]} 상태가 변경되었습니다.`,
    });
  };

  const handleToggleBadge = (menuId, badgeType) => {
    setMenuItems(menuItems.map(item => 
      item.id === menuId 
        ? {
            ...item,
            badge: badgeType ? {
              type: badgeType,
              text: badgeType === "recommend" ? "사장님 추천" : 
                    badgeType === "best" ? "베스트 메뉴" : "신메뉴"
            } : undefined
          }
        : item
    ));
  };

  const handleDeleteMenu = (menuId) => {
    const menu = menuItems.find(item => item.id === menuId);
    setMenuItems(menuItems.filter(item => item.id !== menuId));
    toast({
      title: "메뉴 삭제됨",
      description: `"${menu?.name}" 메뉴가 삭제되었습니다.`,
    });
  };

  const handleDeleteCategory = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    const categoryMenus = menuItems.filter(item => item.categoryId === categoryId);
    
    setCategories(categories.filter(cat => cat.id !== categoryId));
    setMenuItems(menuItems.filter(item => item.categoryId !== categoryId));
    
    toast({
      title: "카테고리 삭제됨",
      description: `"${category?.name}" 카테고리와 ${categoryMenus.length}개의 메뉴가 삭제되었습니다.`,
    });
  };

  const openEditMenu = (menu) => {
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

        {/* Category Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          <Button 
            variant={selectedCategory === "" ? "default" : "outline"}
            onClick={() => setSelectedCategory("")}
            className="whitespace-nowrap"
          >
            전체 메뉴
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems
            .filter(item => selectedCategory === "" || item.categoryId === selectedCategory)
            .map((menu) => {
              const category = categories.find(cat => cat.id === menu.categoryId);
              const IconComponent = defaultCategoryIcons[category?.name] || Utensils;
              
              return (
                <Card key={menu.id} className="hover:shadow-lg transition-all duration-200 relative overflow-hidden">
                  {/* Status Stickers */}
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                    {menu.status.soldOut && (
                      <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                        <AlertTriangle className="w-3 h-3" />
                        품절
                      </Badge>
                    )}
                    {menu.status.ingredientsOut && (
                      <Badge variant="secondary" className="flex items-center gap-1 text-xs bg-orange-100 text-orange-800 hover:bg-orange-100">
                        <Package className="w-3 h-3" />
                        재료 소진
                      </Badge>
                    )}
                    {menu.status.salesStopped && (
                      <Badge variant="outline" className="flex items-center gap-1 text-xs bg-gray-100 text-gray-800 hover:bg-gray-100">
                        <StopCircle className="w-3 h-3" />
                        판매 중지
                      </Badge>
                    )}
                  </div>

                  {/* Recommendation Badge */}
                  {menu.badge && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge 
                        className={`flex items-center gap-1 text-xs ${
                          menu.badge.type === "recommend" ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" :
                          menu.badge.type === "best" ? "bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600" :
                          "bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600"
                        } text-white border-0`}
                      >
                        {menu.badge.type === "recommend" && <Crown className="w-3 h-3" />}
                        {menu.badge.type === "best" && <Star className="w-3 h-3" />}
                        {menu.badge.type === "new" && <Award className="w-3 h-3" />}
                        {menu.badge.text}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4 pt-12">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          {menu.image ? (
                            <img src={menu.image} alt={menu.name} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <IconComponent className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{menu.name}</CardTitle>
                          <Badge variant="secondary" className="text-xs">
                            {category?.name}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditMenu(menu)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost">
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
                              <AlertDialogAction onClick={() => handleDeleteMenu(menu.id)}>
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <CardDescription className="mb-4">
                      {menu.description}
                    </CardDescription>
                    <div className="text-2xl font-bold text-primary">
                      ₩{menu.price.toLocaleString()}
                    </div>

                    {/* Toggle Controls */}
                    <div className="border-t pt-4 space-y-3">
                      <div className="text-sm font-medium text-muted-foreground mb-2">상태 관리</div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <span className="text-sm">품절</span>
                        </div>
                        <Switch
                          checked={menu.status.soldOut}
                          onCheckedChange={() => handleToggleStatus(menu.id, "soldOut")}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-orange-600" />
                          <span className="text-sm">재료 소진</span>
                        </div>
                        <Switch
                          checked={menu.status.ingredientsOut}
                          onCheckedChange={() => handleToggleStatus(menu.id, "ingredientsOut")}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <StopCircle className="w-4 h-4 text-gray-600" />
                          <span className="text-sm">판매 중지</span>
                        </div>
                        <Switch
                          checked={menu.status.salesStopped}
                          onCheckedChange={() => handleToggleStatus(menu.id, "salesStopped")}
                        />
                      </div>

                      {/* Badge Controls */}
                      <div className="border-t pt-3 space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">추천 뱃지</div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant={menu.badge?.type === "recommend" ? "default" : "outline"}
                            onClick={() => handleToggleBadge(menu.id, menu.badge?.type === "recommend" ? null : "recommend")}
                            className="text-xs h-7"
                          >
                            <Crown className="w-3 h-3 mr-1" />
                            사장님 추천
                          </Button>
                          <Button
                            size="sm"
                            variant={menu.badge?.type === "best" ? "default" : "outline"}
                            onClick={() => handleToggleBadge(menu.id, menu.badge?.type === "best" ? null : "best")}
                            className="text-xs h-7"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            베스트
                          </Button>
                          <Button
                            size="sm"
                            variant={menu.badge?.type === "new" ? "default" : "outline"}
                            onClick={() => handleToggleBadge(menu.id, menu.badge?.type === "new" ? null : "new")}
                            className="text-xs h-7"
                          >
                            <Award className="w-3 h-3 mr-1" />
                            신메뉴
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {/* Edit Menu Dialog */}
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
}) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
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
}) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    image: "",
    video: ""
  });

  const handleSubmit = (e) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>메뉴 추가</DialogTitle>
          <DialogDescription>
            새로운 메뉴를 추가합니다.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="menu-name">메뉴 이름</Label>
            <Input
              id="menu-name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="메뉴 이름을 입력하세요"
            />
          </div>
          
          <div>
            <Label htmlFor="menu-description">설명</Label>
            <Textarea
              id="menu-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="메뉴 설명을 입력하세요"
            />
          </div>
          
          <div>
            <Label htmlFor="menu-price">가격</Label>
            <Input
              id="menu-price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="0"
            />
          </div>
          
          <div>
            <Label htmlFor="menu-category">카테고리</Label>
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
          
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="menu-image">이미지 URL</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="menu-image"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                  placeholder="이미지 URL (선택사항)"
                />
                <Button type="button" size="sm" variant="outline">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div>
            <Label htmlFor="menu-video">동영상 URL</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="menu-video"
                value={formData.video}
                onChange={(e) => setFormData({...formData, video: e.target.value})}
                placeholder="동영상 URL (선택사항)"
              />
              <Button type="button" size="sm" variant="outline">
                <Video className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.price || !formData.categoryId}>
              추가
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
}) {
  const [formData, setFormData] = useState({
    name: menu.name,
    description: menu.description,
    price: menu.price.toString(),
    categoryId: menu.categoryId,
    image: menu.image || "",
    video: menu.video || ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.price && formData.categoryId) {
      onEdit({
        ...menu,
        ...formData,
        price: parseInt(formData.price),
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>메뉴 수정</DialogTitle>
          <DialogDescription>
            메뉴 정보를 수정합니다.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit-menu-name">메뉴 이름</Label>
            <Input
              id="edit-menu-name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="메뉴 이름을 입력하세요"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-menu-description">설명</Label>
            <Textarea
              id="edit-menu-description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="메뉴 설명을 입력하세요"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-menu-price">가격</Label>
            <Input
              id="edit-menu-price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: e.target.value})}
              placeholder="0"
            />
          </div>
          
          <div>
            <Label htmlFor="edit-menu-category">카테고리</Label>
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
            <Label htmlFor="edit-menu-image">이미지 URL</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="edit-menu-image"
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                placeholder="이미지 URL (선택사항)"
              />
              <Button type="button" size="sm" variant="outline">
                <Upload className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="edit-menu-video">동영상 URL</Label>
            <div className="flex gap-2 mt-2">
              <Input
                id="edit-menu-video"
                value={formData.video}
                onChange={(e) => setFormData({...formData, video: e.target.value})}
                placeholder="동영상 URL (선택사항)"
              />
              <Button type="button" size="sm" variant="outline">
                <Video className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button type="submit" disabled={!formData.name || !formData.price || !formData.categoryId}>
              저장
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 