export interface PhotoWallPost {
  id: string;
  url: string;
  username: string;
  timestamp: string;
  approved: boolean;
  alternativeUrl?: string;
}

export const demoPhotos: PhotoWallPost[] = [
  {
    id: "1",
    url: "/carousel-1.webp",
    username: "María González",
    timestamp: "2024-02-18T20:30:00",
    approved: true
  },
  {
    id: "2",
    url: "/carousel-2.webp",
    username: "Carlos López",
    timestamp: "2024-02-18T21:00:00",
    approved: true
  },
  {
    id: "3",
    url: "/carousel-1.webp",
    username: "Ana Martínez",
    timestamp: "2024-02-18T21:15:00",
    approved: true
  },
  {
    id: "4",
    url: "/carousel-2.webp",
    username: "Roberto Silva",
    timestamp: "2024-02-18T21:45:00",
    approved: true
  },
  {
    id: "5",
    url: "/carousel-1.webp",
    username: "Sofia Rodríguez",
    timestamp: "2024-02-18T22:30:00",
    approved: true
  },
  {
    id: "6",
    url: "/carousel-2.webp",
    username: "Diego Fernández",
    timestamp: "2024-02-18T23:00:00",
    approved: true
  },
  {
    id: "7",
    url: "/carousel-1.webp",
    username: "Patricia Morales",
    timestamp: "2024-02-18T23:30:00",
    approved: true
  },
  {
    id: "8",
    url: "/carousel-2.webp",
    username: "Marcos Herrera",
    timestamp: "2024-02-19T00:15:00",
    approved: true
  },
  {
    id: "9",
    url: "/carousel-1.webp",
    username: "Laura Jiménez",
    timestamp: "2024-02-19T00:45:00",
    approved: true
  },
  {
    id: "10",
    url: "/carousel-2.webp",
    username: "Javier Ruiz",
    timestamp: "2024-02-19T01:00:00",
    approved: true
  },
  {
    id: "11",
    url: "/carousel-1.webp",
    username: "Carmen Vega",
    timestamp: "2024-02-19T01:30:00",
    approved: true
  },
  {
    id: "12",
    url: "/carousel-2.webp",
    username: "Alejandro Torres",
    timestamp: "2024-02-19T02:00:00",
    approved: true
  }
];

