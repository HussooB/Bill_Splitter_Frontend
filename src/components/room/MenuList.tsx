import { Card } from "@/components/ui/card";

const MenuList = () => {
  // Mock data - will be replaced with API calls
  const menuItems = [
    { id: "1", name: "Margherita Pizza", price: 15.99 },
    { id: "2", name: "Caesar Salad", price: 8.99 },
    { id: "3", name: "Spaghetti Carbonara", price: 13.99 },
    { id: "4", name: "Tiramisu", price: 6.99 },
    { id: "5", name: "Wine Bottle", price: 22.0 },
  ];

  const total = menuItems.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Menu Items</h2>
        <div className="space-y-3">
          {menuItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <span className="text-foreground">{item.name}</span>
              <span className="font-semibold">${item.price.toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <span className="font-semibold text-lg">Total</span>
          <span className="font-bold text-xl text-primary">
            ${total.toFixed(2)}
          </span>
        </div>
      </Card>
    </div>
  );
};

export default MenuList;
