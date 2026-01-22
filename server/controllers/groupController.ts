/* server/controllers/groupController.ts */
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Group from '../models/Group';
import Task from '../models/Task';
import User from '../models/User';

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
      members: [ownerId], // Người tạo tự động là thành viên
    });

    await newGroup.save();
    res.status(201).json({ success: true, group: newGroup });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi tạo nhóm' });
  }
};

// Lấy chi tiết nhóm (để hiển thị lên trang Group Detail)
export const getGroupDetails = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;

    // 1. Lấy thông tin nhóm và populate member
    const group = await Group.findById(groupId)
      .populate('members', 'username email avatar')
      .populate('owner', 'username');

    if (!group) {
      res.status(404).json({ success: false, message: 'Không tìm thấy nhóm' });
      return;
    }

    // 2. Lấy tất cả Task của nhóm này để vẽ lên Kanban Board
    // 👇 [FIXED] Thêm điều kiện isDeleted: { $ne: true } để ẩn task đã xóa
    const tasks = await Task.find({
      group: groupId,
      isDeleted: { $ne: true },
    })
      .populate('assignee', 'username avatar email') // Để hiện tên người làm
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        id: group._id,
        title: group.name,
        description: group.description,
        inviteCode: group.inviteCode,
        members: group.members,
        tasks: tasks, // Frontend sẽ dùng mảng này để filter theo status (Todo, In Progress...)
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi lấy dữ liệu nhóm' });
  }
};

// Mời thành viên (Add Member)
export const addMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống',
      });
      return;
    }

    const group = await Group.findById(groupId);
    if (!group) {
      res.status(404).json({ success: false, message: 'Nhóm không tồn tại' });
      return;
    }

    // Ép kiểu về string để so sánh tránh lỗi ObjectId
    const isMember = group.members.some(
      (memberId) => memberId.toString() === user._id.toString()
    );
    if (isMember) {
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

// [MỚI] Lấy danh sách nhóm của user hiện tại (để hiện lên Sidebar)
export const getMyGroups = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = (req as any).user._id;

    // Tìm các group mà user là Owner HOẶC nằm trong danh sách Members
    const groups = await Group.find({
      $or: [{ owner: userId }, { members: userId }],
    })
      .select('name members') // Chỉ lấy tên và số lượng thành viên (để nhẹ payload)
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

// Join group bằng code
export const joinGroupByCode = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.body;
    const userId = (req as any).user._id;

    // Tìm group theo code
    const group = await Group.findOne({ inviteCode });
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: 'Mã mời không hợp lệ' });

    // Check đã tham gia chưa
    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (isMember) {
      return res
        .status(400)
        .json({ success: false, message: 'Bạn đã là thành viên nhóm này' });
    }

    // Add member
    group.members.push(userId);
    await group.save();

    res.json({ success: true, group: { name: group.name } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi join group' });
  }
};

// 👇 [MỚI] API Lấy Bảng xếp hạng thành viên trong Group
export const getGroupLeaderboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { groupId } = req.params;

    // Sử dụng Aggregation để thống kê
    const leaderboard = await Task.aggregate([
      // 1. Chỉ lấy task của Group này và đã Hoàn thành
      {
        $match: {
          group: new mongoose.Types.ObjectId(groupId),
          status: 'completed',
          // 👇 [FIXED] Không tính điểm cho task đã xóa
          isDeleted: { $ne: true },
        },
      },
      // 2. Nhóm theo người được giao việc (Assignee) và đếm
      {
        $group: {
          _id: '$assignee',
          completedCount: { $sum: 1 }, // Cộng 1 cho mỗi task
        },
      },
      // 3. Sắp xếp giảm dần (Ai làm nhiều nhất lên đầu)
      { $sort: { completedCount: -1 } },
      // 4. Join với bảng Users để lấy tên và avatar
      {
        $lookup: {
          from: 'users', // Tên collection trong DB (thường là số nhiều chữ thường)
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo',
        },
      },
      // 5. Làm phẳng mảng userInfo
      { $unwind: '$userInfo' },
      // 6. Chọn các trường cần trả về
      {
        $project: {
          _id: 1, // UserID
          completedCount: 1,
          username: '$userInfo.username',
          avatar: '$userInfo.avatar',
          badges: '$userInfo.badges', // Lấy luôn badge để hiển thị
        },
      },
    ]);

    res.json({ success: true, leaderboard });
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ success: false, message: 'Lỗi lấy bảng xếp hạng' });
  }
};

// ADMIN
// 👇 [UPDATED] API Admin Get Groups (Pagination + Search + Sort)
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

    // Filter query
    const query: any = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Sort option
    const sortValue = order === 'asc' ? 1 : -1;
    const sortOption: any = { [sortBy]: sortValue };

    const groups = await Group.find(query)
      .populate('owner', 'username email avatar')
      .populate('members', 'username email avatar')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalGroups = await Group.countDocuments(query);

    res.json({
      success: true,
      count: groups.length,
      total: totalGroups,
      currentPage: page,
      totalPages: Math.ceil(totalGroups / limit),
      groups,
    });
  } catch (error) {
    console.error('Admin Get Groups Error:', error);
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi lấy danh sách nhóm' });
  }
};

// 👇 [UPDATED] Admin xóa Group
export const deleteGroupAdmin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    // Xóa task của nhóm
    await Task.deleteMany({ group: id });
    await Group.findByIdAndDelete(id);
    res.json({ success: true, message: 'Đã giải tán nhóm thành công' });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: 'Lỗi server khi xóa nhóm' });
  }
};

// 👇 [THÊM MỚI] Admin Update Group
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
      { new: true } // Trả về data mới
    );

    if (!group) {
      res.status(404).json({ success: false, message: 'Không tìm thấy nhóm' });
      return;
    }

    res.json({ success: true, message: 'Cập nhật nhóm thành công', group });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi cập nhật nhóm' });
  }
};
