/* server/controllers/groupController.ts */
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Group from '../models/Group';
import Task from '../models/Task';
import User from '../models/User';

// Helper: Xử lý Task khi thành viên rời nhóm
const processMemberDeparture = async (
  groupId: string,
  userId: string,
  groupOwnerId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const tasksAssignedToUser = await Task.find({
      group: groupId,
      assignee: userId,
      creator: { $ne: new mongoose.Types.ObjectId(userId) },
    }).session(session);

    for (const task of tasksAssignedToUser) {
      task.assignee = task.creator;
      await task.save({ session });
    }

    await Task.updateMany(
      { group: groupId, creator: userId, assignee: userId, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    ).session(session);

    await Task.updateMany(
      {
        group: groupId,
        creator: userId,
      },
      { $set: { creator: groupOwnerId } }
    ).session(session);

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Tạo nhóm mới
export const createGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description } = req.body;
    const ownerId = (req as any).user._id;

    const newGroup = new Group({
      name,
      description,
      owner: ownerId,
      members: [ownerId],
    });

    await newGroup.save();
    res.status(201).json({ success: true, group: newGroup });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tạo nhóm' });
  }
};

// Lấy chi tiết nhóm
export const getGroupDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const group = await Group.findById(groupId)
      .populate('members', 'username email avatar')
      .populate('owner', 'username email avatar');

    if (!group) {
      res.status(404).json({ success: false, message: 'Không tìm thấy nhóm' });
      return;
    }

    const tasks = await Task.find({
      group: groupId,
      isDeleted: { $ne: true },
    })
      .populate('assignee', 'username avatar email')
      .populate('creator', 'username avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        id: group._id,
        title: group.name,
        description: group.description,
        inviteCode: group.inviteCode,
        members: group.members,
        owner: group.owner,
        tasks: tasks,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy dữ liệu nhóm' });
  }
};

// Add member
export const addMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ success: false, message: 'Email không tồn tại' });
      return;
    }
    const group = await Group.findById(groupId);
    if (!group) {
      res.status(404).json({ success: false, message: 'Nhóm không tồn tại' });
      return;
    }
    if (group.members.some((m) => m.toString() === user._id.toString())) {
      res
        .status(400)
        .json({ success: false, message: 'Thành viên này đã ở trong nhóm' });
      return;
    }
    group.members.push(user._id as any);
    await group.save();
    res.json({ success: true, message: 'Thêm thành viên thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Kick member
export const removeMember = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;
    const currentUserId = (req as any).user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      res.status(404).json({ success: false, message: 'Nhóm không tồn tại' });
      return;
    }

    if (group.owner.toString() !== currentUserId.toString()) {
      res
        .status(403)
        .json({ success: false, message: 'Chỉ trưởng nhóm mới có quyền này' });
      return;
    }

    if (userId === currentUserId.toString()) {
      res
        .status(400)
        .json({ success: false, message: 'Không thể tự kick chính mình' });
      return;
    }

    await processMemberDeparture(groupId, userId, group.owner.toString());

    group.members = group.members.filter((m) => m.toString() !== userId);
    await group.save();

    res.json({
      success: true,
      message: 'Đã xóa thành viên và xử lý bàn giao công việc',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi xóa thành viên' });
  }
};

// Leave group
export const leaveGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const currentUserId = (req as any).user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      res.status(404).json({ success: false, message: 'Nhóm không tồn tại' });
      return;
    }

    if (group.owner.toString() === currentUserId.toString()) {
      res.status(400).json({
        success: false,
        message: 'Trưởng nhóm không thể rời nhóm.',
      });
      return;
    }

    if (!group.members.some((m) => m.toString() === currentUserId.toString())) {
      res.status(400).json({
        success: false,
        message: 'Bạn không phải thành viên nhóm này',
      });
      return;
    }

    await processMemberDeparture(
      groupId,
      currentUserId,
      group.owner.toString()
    );

    group.members = group.members.filter(
      (m) => m.toString() !== currentUserId.toString()
    );
    await group.save();

    res.json({ success: true, message: 'Đã rời nhóm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi khi rời nhóm' });
  }
};

// Disband Group
export const disbandGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const currentUserId = (req as any).user._id;
    const group = await Group.findById(groupId);
    if (!group) {
      res.status(404).json({ success: false, message: 'Nhóm không tồn tại' });
      return;
    }
    if (group.owner.toString() !== currentUserId.toString()) {
      res
        .status(403)
        .json({ success: false, message: 'Chỉ trưởng nhóm được giải tán' });
      return;
    }
    await Task.deleteMany({ group: groupId });
    await Group.findByIdAndDelete(groupId);
    res.json({ success: true, message: 'Đã giải tán nhóm thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi giải tán nhóm' });
  }
};

// Update Group
export const updateGroup = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { name, title, description } = req.body;
    const newName = name || title;
    const userId = (req as any).user._id;

    if (!newName) {
      res
        .status(400)
        .json({ success: false, message: 'Tên nhóm không được để trống' });
      return;
    }

    const group = await Group.findOneAndUpdate(
      { _id: groupId, owner: userId },
      { name: newName, description },
      { new: true }
    );

    if (!group) {
      res
        .status(403)
        .json({ success: false, message: 'Không có quyền sửa nhóm' });
      return;
    }

    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật nhóm' });
  }
};

export const getMyGroups = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user._id;
    const groups = await Group.find({
      $or: [{ owner: userId }, { members: userId }],
    })
      .select('name members')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      groups: groups.map((g) => ({
        _id: g._id,
        name: g.name,
        memberCount: g.members.length,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tải danh sách nhóm' });
  }
};

export const joinGroupByCode = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const userId = (req as any).user._id;
    const group = await Group.findOne({ inviteCode });
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: 'Mã mời không hợp lệ' });
    if (group.members.some((m) => m.toString() === userId.toString())) {
      return res
        .status(400)
        .json({ success: false, message: 'Bạn đã là thành viên nhóm này' });
    }
    group.members.push(userId);
    await group.save();
    res.json({ success: true, group: { name: group.name } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi join group' });
  }
};

export const getGroupLeaderboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;
    const leaderboard = await Task.aggregate([
      {
        $match: {
          group: new mongoose.Types.ObjectId(groupId),
          status: 'completed',
          isDeleted: { $ne: true },
        },
      },
      { $group: { _id: '$assignee', completedCount: { $sum: 1 } } },
      { $sort: { completedCount: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          _id: 1,
          completedCount: 1,
          username: '$userInfo.username',
          avatar: '$userInfo.avatar',
          badges: '$userInfo.badges',
        },
      },
    ]);
    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy bảng xếp hạng' });
  }
};

export const getAllGroupsAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const order = (req.query.order as string) || 'desc';
    const skip = (page - 1) * limit;
    const query: any = {};
    if (search) query.name = { $regex: search, $options: 'i' };
    const sortOption: any = { [sortBy]: order === 'asc' ? 1 : -1 };
    const groups = await Group.find(query)
      .populate('owner', 'username email avatar')
      .populate('members', 'username email avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);
    const totalGroups = await Group.countDocuments(query);
    res.json({
      success: true,
      total: totalGroups,
      totalPages: Math.ceil(totalGroups / limit),
      groups,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Lỗi lấy danh sách nhóm admin' });
  }
};

export const deleteGroupAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    await Task.deleteMany({ group: id });
    await Group.findByIdAndDelete(id);
    res.json({ success: true, message: 'Đã giải tán nhóm thành công' });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi xóa nhóm' });
  }
};

export const updateGroupAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const group = await Group.findByIdAndUpdate(
      id,
      { name, description },
      { new: true }
    );
    res.json({ success: true, message: 'Cập nhật thành công', group });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
