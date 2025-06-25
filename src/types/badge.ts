export interface Badge {
  _id: string;
  ownerId: string;
  badgeName: string;
  badgeImage: string;
  eventName: string;
  eventId: string;
  createdBy: {
    userId: string;
    username: string;
    email: string;
    role: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBadgeRequest {
  badgeName: string;
  badgeImage: string;
  eventId: string;
} 