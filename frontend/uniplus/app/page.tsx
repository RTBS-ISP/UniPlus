import { fetchItems, Item } from '../utils/api';
 
export default async function Home() {
  const items = await fetchItems();
 
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Items from Django Ninja Backend</h1>
      <ul className="space-y-4">
        {items.map((item: Item) => (
          <li key={item.id} className="bg-white shadow rounded-lg p-4">
            <h2 className="text-xl font-semibold">{item.name}</h2>
            <p className="text-gray-600">{item.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
