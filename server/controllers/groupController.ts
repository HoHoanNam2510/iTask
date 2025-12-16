import { Request, Response } from 'express';
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
    const tasks = await Task.find({ group: groupId })
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
    if (group.members.includes(userId)) {
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
