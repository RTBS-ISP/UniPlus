// import { fetchItems, Item } from '../utils/api';
 
// export default async function Home() {
//   const items = await fetchItems();
 
//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-3xl font-bold mb-4">Items from Django Ninja Backend</h1>
//       <ul className="space-y-4">
//         {items.map((item: Item) => (
//           <li key={item.id} className="bg-white shadow rounded-lg p-4">
//             <h2 className="text-xl font-semibold">{item.name}</h2>
//             <p className="text-gray-600">{item.description}</p>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// app/page.tsx
import React from "react";

export default function Home() {
  // Temporary placeholder items
  const items = [
    { id: 1, name: "Item 1", description: "This is item 1" },
    { id: 2, name: "Item 2", description: "This is item 2" },
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Items</h1>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="bg-white shadow rounded-lg p-4">
            <h2 className="text-xl font-semibold">{item.name}</h2>
            <p className="text-gray-600">{item.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}